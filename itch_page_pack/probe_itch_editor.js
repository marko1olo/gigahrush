(async () => {
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    await runEditorProbe();
    return;
  }

  await runPublicPageProbe();
})().catch((err) => {
  const message = err && err.stack ? err.stack : String(err);
  if (typeof console !== "undefined") console.error(message);
  if (typeof process !== "undefined") process.exitCode = 1;
});

async function runEditorProbe() {
  document.title = "PROBE_OK " + document.title;
  const beacon = (name, obj) => {
    const json = JSON.stringify(obj);
    const chunkSize = 1600;
    const total = Math.ceil(json.length / chunkSize);
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.src = "http://127.0.0.1:8790/beacon?name=" + encodeURIComponent(name) +
        "&seq=" + i + "&total=" + total + "&data=" + encodeURIComponent(json.slice(i * chunkSize, (i + 1) * chunkSize));
    }
  };
  const pick = (el) => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      type: el.getAttribute("type") || "",
      name: el.getAttribute("name") || "",
      id: el.id || "",
      className: String(el.className || ""),
      placeholder: el.getAttribute("placeholder") || "",
      aria: el.getAttribute("aria-label") || "",
      text: (el.innerText || el.value || el.textContent || "").trim().slice(0, 320),
      value: "value" in el ? String(el.value).slice(0, 320) : "",
      checked: "checked" in el ? !!el.checked : undefined,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  };
  const forms = [...document.forms].map((form, i) => ({
    i,
    action: form.action,
    method: form.method,
    id: form.id,
    className: String(form.className || ""),
    controls: [...form.elements].slice(0, 240).map(pick),
  }));
  const report = {
    name: "probe_editor",
    href: location.href,
    title: document.title,
    forms,
    editable: [...document.querySelectorAll("[contenteditable=true], textarea, input")].slice(0, 260).map(pick),
    buttons: [...document.querySelectorAll("button, input[type=submit], a.button, .button")].slice(0, 160).map(pick),
    headings: [...document.querySelectorAll("h1,h2,h3,legend,label")].slice(0, 220).map(pick),
    bodyText: document.body.innerText.slice(0, 12000),
  };
  await fetch("http://127.0.0.1:8790", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(report),
  }).catch(() => beacon("probe_editor", report));
  beacon("probe_editor_fallback", report);
  console.log("[itch probe] report sent", report);
}

async function runPublicPageProbe() {
  const args = parseNodeArgs(process.argv.slice(2));
  if (args.help) {
    printPublicProbeHelp();
    return;
  }

  const { readFile } = await import("node:fs/promises");
  const { dirname, resolve } = await import("node:path");

  const scriptPath = process.argv[1] || "itch_page_pack/probe_itch_editor.js";
  const scriptDir = dirname(resolve(scriptPath));
  const manifestPath = args.manifest ? resolve(process.cwd(), args.manifest) : resolve(scriptDir, "upload_manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const probe = manifest.public_probe || {};
  const targetUrl = args.url || probe.url || manifest.public_url;
  const groups = buildAssertionGroups(probe.assertions || {});
  const configErrors = validatePublicProbeConfig(targetUrl, groups);

  if (args.dryRun) {
    const dryRun = {
      ok: configErrors.length === 0,
      mode: "dry-run",
      network: "skipped",
      manifest: manifestPath,
      url: targetUrl || null,
      assertions: groups.map((group) => ({ key: group.key, count: group.markers.length, markers: group.markers })),
      errors: configErrors,
    };
    if (args.json) console.log(JSON.stringify(dryRun, null, 2));
    else printDryRun(dryRun);
    if (!dryRun.ok) process.exitCode = 1;
    return;
  }

  if (configErrors.length > 0) {
    for (const error of configErrors) console.error("[itch public probe] " + error);
    process.exitCode = 1;
    return;
  }

  let html;
  let source;
  let status = null;
  let finalUrl = targetUrl;
  let elapsedMs = 0;
  if (args.html) {
    const htmlPath = resolve(process.cwd(), args.html);
    html = await readFile(htmlPath, "utf8");
    source = htmlPath;
  } else {
    const fetched = await fetchPublicHtml(targetUrl, args);
    html = fetched.html;
    source = fetched.requestUrl;
    status = fetched.status;
    finalUrl = fetched.finalUrl;
    elapsedMs = fetched.elapsedMs;
  }

  const result = checkPublicPage(html, groups, {
    url: targetUrl,
    source,
    status,
    finalUrl,
    elapsedMs,
  });
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printPublicProbeResult(result);
  if (!result.ok) process.exitCode = 1;
}

function parseNodeArgs(argv) {
  const args = {
    cacheBust: false,
    dryRun: false,
    help: false,
    html: "",
    json: false,
    manifest: "",
    timeoutMs: 15000,
    url: "",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--public") continue;
    if (arg === "--cache-bust") {
      args.cacheBust = true;
      continue;
    }
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--html" || arg === "--manifest" || arg === "--timeout-ms" || arg === "--url") {
      const value = argv[++i];
      if (!value) throw new Error(arg + " requires a value");
      if (arg === "--html") args.html = value;
      if (arg === "--manifest") args.manifest = value;
      if (arg === "--timeout-ms") args.timeoutMs = Number(value);
      if (arg === "--url") args.url = value;
      continue;
    }
    if (arg.startsWith("--html=")) {
      args.html = arg.slice("--html=".length);
      continue;
    }
    if (arg.startsWith("--manifest=")) {
      args.manifest = arg.slice("--manifest=".length);
      continue;
    }
    if (arg.startsWith("--timeout-ms=")) {
      args.timeoutMs = Number(arg.slice("--timeout-ms=".length));
      continue;
    }
    if (arg.startsWith("--url=")) {
      args.url = arg.slice("--url=".length);
      continue;
    }
    throw new Error("Unknown argument: " + arg);
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) throw new Error("--timeout-ms must be a positive number");
  return args;
}

function buildAssertionGroups(assertions) {
  return [
    { key: "title", label: "title marker", markers: stringList(assertions.title_markers), haystack: "title" },
    { key: "copy", label: "copy marker", markers: stringList(assertions.copy_markers), haystack: "text" },
    { key: "key_image", label: "key image marker", markers: stringList(assertions.key_image_markers), haystack: "raw" },
    { key: "version", label: "version marker", markers: stringList(assertions.version_markers), haystack: "all" },
  ];
}

function stringList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
}

function validatePublicProbeConfig(targetUrl, groups) {
  const errors = [];
  if (!targetUrl) errors.push("No public URL configured. Set public_probe.url or public_url in upload_manifest.json.");
  else {
    try {
      const url = new URL(targetUrl);
      if (url.protocol !== "https:") errors.push("Public URL must use https: " + targetUrl);
    } catch {
      errors.push("Public URL is invalid: " + targetUrl);
    }
  }
  for (const group of groups) {
    if ((group.key === "version" || group.key === "key_image") && group.markers.length === 0) continue;
    if (group.markers.length === 0) errors.push("Missing " + group.key + " assertions in upload_manifest.json.");
  }
  return errors;
}

async function fetchPublicHtml(targetUrl, args) {
  const requestUrl = args.cacheBust ? withCacheBust(targetUrl) : targetUrl;
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs);
  try {
    const res = await fetch(requestUrl, {
      method: "GET",
      redirect: "follow",
      credentials: "omit",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "user-agent": "GIGAH-RUSH itch public verifier; logged-out GET",
      },
    });
    const html = await res.text();
    if (res.status < 200 || res.status >= 300) {
      throw new Error("Public GET returned HTTP " + res.status + " for " + requestUrl);
    }
    return { html, status: res.status, finalUrl: res.url, requestUrl, elapsedMs: Date.now() - started };
  } finally {
    clearTimeout(timeout);
  }
}

function withCacheBust(targetUrl) {
  const url = new URL(targetUrl);
  url.searchParams.set("public_probe", String(Date.now()));
  return String(url);
}

function checkPublicPage(html, groups, meta) {
  const title = extractTitle(html);
  const text = htmlToText(html);
  const raw = normalizeProbeText(html + "\n" + decodePercentEscapes(decodeEntities(html)));
  const haystacks = {
    all: normalizeProbeText(title + "\n" + text + "\n" + raw),
    raw,
    text: normalizeProbeText(text),
    title: normalizeProbeText(title + "\n" + text),
  };
  const failures = [];
  const passed = [];

  for (const group of groups) {
    const haystack = haystacks[group.haystack];
    for (const marker of group.markers) {
      const normalizedMarker = normalizeProbeText(marker);
      if (haystack.includes(normalizedMarker)) passed.push({ group: group.key, marker });
      else failures.push({ group: group.key, label: group.label, marker });
    }
  }

  return {
    ok: failures.length === 0,
    url: meta.url,
    source: meta.source,
    status: meta.status,
    finalUrl: meta.finalUrl,
    elapsedMs: meta.elapsedMs,
    bytes: html.length,
    title,
    checked: groups.map((group) => ({ key: group.key, count: group.markers.length })),
    passed,
    failures,
    imageHints: listImageHints(html),
  };
}

function extractTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? htmlToText(match[1]) : "";
}

function htmlToText(html) {
  return normalizeProbeText(decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ));
}

function decodeEntities(text) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
  };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
    const key = body.toLowerCase();
    if (key[0] === "#") {
      const code = key[1] === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }
    return Object.prototype.hasOwnProperty.call(named, key) ? named[key] : entity;
  });
}

function decodePercentEscapes(text) {
  return text.replace(/(?:%[0-9a-f]{2})+/gi, (chunk) => {
    try {
      return decodeURIComponent(chunk);
    } catch {
      return chunk;
    }
  });
}

function normalizeProbeText(text) {
  return String(text).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function listImageHints(html) {
  const hints = [];
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of tags.slice(0, 40)) {
    hints.push({
      src: readAttr(tag, "src"),
      alt: readAttr(tag, "alt"),
      title: readAttr(tag, "title"),
    });
  }
  return hints.filter((hint) => hint.src || hint.alt || hint.title);
}

function readAttr(tag, name) {
  const pattern = new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i");
  const match = tag.match(pattern);
  return match ? decodeEntities(decodePercentEscapes(match[2])).slice(0, 240) : "";
}

function printDryRun(dryRun) {
  console.log("[itch public probe] dry run");
  console.log("manifest: " + dryRun.manifest);
  console.log("url: " + (dryRun.url || "(missing)"));
  console.log("network: skipped; normal probe uses logged-out public GET with no credentials");
  for (const group of dryRun.assertions) {
    console.log(group.key + " markers (" + group.count + "):");
    for (const marker of group.markers) console.log("  - " + marker);
  }
  for (const error of dryRun.errors) console.error("ERROR: " + error);
}

function printPublicProbeResult(result) {
  const status = result.status === null ? "file" : "HTTP " + result.status;
  console.log("[itch public probe] " + (result.ok ? "OK" : "FAIL") + " " + status);
  console.log("url: " + result.url);
  console.log("source: " + result.source);
  if (result.finalUrl && result.finalUrl !== result.url) console.log("final: " + result.finalUrl);
  if (result.elapsedMs) console.log("elapsed: " + result.elapsedMs + "ms");
  console.log("title: " + (result.title || "(missing)"));
  console.log("bytes: " + result.bytes);
  for (const group of result.checked) console.log("checked " + group.key + ": " + group.count);
  if (result.failures.length > 0) {
    console.error("missing markers:");
    for (const failure of result.failures) console.error("  - " + failure.label + ": " + failure.marker);
    if (result.imageHints.length > 0) {
      console.error("first image hints:");
      for (const hint of result.imageHints.slice(0, 8)) console.error("  - " + [hint.src, hint.alt, hint.title].filter(Boolean).join(" | "));
    }
  }
}

function printPublicProbeHelp() {
  console.log(`Usage:
  node itch_page_pack/probe_itch_editor.js [--public] [--url URL]
  node itch_page_pack/probe_itch_editor.js --dry-run
  node itch_page_pack/probe_itch_editor.js --html /tmp/gigahrush-itch.html

Options:
  --public          No-op in Node; documents that this is the public-page path.
  --url URL         Override public_probe.url from upload_manifest.json.
  --html FILE       Check a saved public HTML file instead of making a GET request.
  --cache-bust      Add ?public_probe=<timestamp> to the request URL.
  --dry-run         Validate configured URL and marker groups without network access.
  --json            Print machine-readable output.
  --manifest FILE   Override itch_page_pack/upload_manifest.json.
  --timeout-ms N    Public GET timeout, default 15000.

When pasted into the authenticated itch editor page, this file still runs the editor form probe.`);
}
