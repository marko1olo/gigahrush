import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;
const CYRILLIC_RE = /[А-Яа-яЁё]/;
const TEMPLATE_PLACEHOLDER_RE = /\$\{[^}]+\}|\{[A-Za-z_][A-Za-z0-9_]*\}/;

type RuntimeLocaleCatalog = [
  [string, string][],
  [string, string][],
];

function normalizeModuleId(id: string): string {
  const clean = id.split("?")[0] ?? id;
  const normalized = clean.split(path.sep).join("/");
  const rootPrefix = `${root.split(path.sep).join("/")}/`;
  return normalized.startsWith(rootPrefix) ? normalized.slice(rootPrefix.length) : normalized;
}

function buildSizeManifest(): Plugin {
  let manifest = "";

  return {
    name: "gigahrush-build-size-manifest",
    apply: "build",
    enforce: "pre",
    generateBundle(_options, bundle) {
      const chunks = [];
      const assets = [];
      const modules = [];

      for (const output of Object.values(bundle)) {
        if (output.type === "chunk") {
          chunks.push({
            fileName: output.fileName,
            bytes: Buffer.byteLength(output.code, "utf8"),
            moduleCount: Object.keys(output.modules).length,
          });

          for (const [id, info] of Object.entries(output.modules)) {
            modules.push({
              id: normalizeModuleId(id),
              chunk: output.fileName,
              originalLength: info.originalLength,
              renderedLength: info.renderedLength,
            });
          }
        } else {
          const source = output.source;
          const bytes = typeof source === "string" ? Buffer.byteLength(source, "utf8") : source.length;
          assets.push({ fileName: output.fileName, bytes });
        }
      }

      manifest = JSON.stringify({ version: 1, chunks, assets, modules }, null, 2);
    },
    async writeBundle(options) {
      if (!manifest) return;
      const outDir = options.dir ? (path.isAbsolute(options.dir) ? options.dir : path.resolve(root, options.dir)) : path.resolve(root, "dist");
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, "build-size-manifest.json"), manifest);
    },
  };
}

function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

function sourceKey(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function runtimeEnglishLocale(): RuntimeLocaleCatalog {
  const file = path.join(root, "locales", "en.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as {
    entries?: Record<string, { source?: unknown; translation?: unknown; status?: unknown } | string>;
  };
  const exact: [string, string][] = [];
  const templates: [string, string][] = [];
  const exactSources = new Map<string, string>();

  for (const record of Object.values(parsed.entries ?? {})) {
    if (typeof record !== "object" || !record || record.status === "todo") continue;
    if (typeof record.source !== "string" || typeof record.translation !== "string") continue;
    const source = normalizeText(record.source);
    const translation = normalizeText(record.translation);
    if (!source || !translation || !CYRILLIC_RE.test(source)) continue;
    if (TEMPLATE_PLACEHOLDER_RE.test(source)) {
      templates.push([source, translation]);
      continue;
    }

    const key = sourceKey(source);
    const previous = exactSources.get(key);
    if (previous && previous !== source) {
      throw new Error(`English locale runtime hash collision between "${previous}" and "${source}"`);
    }
    exactSources.set(key, source);
    exact.push([key, translation]);
  }

  return [exact, templates];
}

export default defineConfig({
  plugins: [buildSizeManifest(), viteSingleFile()],
  define: {
    "globalThis.__GIGAHRUSH_EN_LOCALE__": JSON.stringify(runtimeEnglishLocale()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
