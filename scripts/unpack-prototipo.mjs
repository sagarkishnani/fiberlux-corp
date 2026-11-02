import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";

const [, , bundlePath, outDir] = process.argv;
if (!bundlePath || !outDir) {
  console.error("Uso: node scripts/unpack-prototipo.mjs <bundle.html> <carpeta-salida>");
  process.exit(1);
}

const html = readFileSync(bundlePath, "utf8");

function readBlock(type) {
  const match = html.match(new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`));
  return match ? JSON.parse(match[1]) : null;
}

const manifest = readBlock("manifest") ?? {};
const template = readBlock("template") ?? "";
const extResources = readBlock("ext_resources") ?? [];

const idByUuid = Object.fromEntries(extResources.map((entry) => [entry.uuid, entry.id]));
const assetIdByName = {};
const assetMap = template.match(/var M=(\{[^}]*\})/);
if (assetMap) {
  for (const [name, id] of Object.entries(JSON.parse(assetMap[1]))) assetIdByName[id] = name;
}

function bytesOf(entry) {
  const raw = Buffer.from(entry.data, "base64");
  return entry.compressed ? gunzipSync(raw) : raw;
}

mkdirSync(join(outDir, "pages"), { recursive: true });
mkdirSync(join(outDir, "assets"), { recursive: true });

let pages = 0;
let assets = 0;
for (const [uuid, entry] of Object.entries(manifest)) {
  const id = idByUuid[uuid];
  if (!id) continue;
  if (id.endsWith(".dc.html")) {
    writeFileSync(join(outDir, "pages", decodeURIComponent(id.replace(/^\.\//, ""))), bytesOf(entry));
    pages++;
  } else if (assetIdByName[id]) {
    writeFileSync(join(outDir, assetIdByName[id]), bytesOf(entry));
    assets++;
  }
}

console.log(`${pages} páginas y ${assets} assets en ${outDir}`);
