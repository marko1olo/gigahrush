(async () => {
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
})();
