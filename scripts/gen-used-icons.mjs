#!/usr/bin/env node
// Genera src/icons/used-icons.generated.ts con solo los íconos Lucide que usa el contenido (SPEC 128).
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "src/content");
const outFile = join(root, "src/icons/used-icons.generated.ts");
const catalogFile = join(root, "src/icons/lucide-catalog.generated.mjs");
const lucideSource = join(root, "node_modules/react-icons/lu/index.mjs");

export const toLucideExport = (name) =>
  "Lu" + name.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join("");

const available = new Set(
  [...readFileSync(join(root, "node_modules/react-icons/lu/index.d.ts"), "utf8").matchAll(/export declare const (Lu\w+)/g)].map((m) => m[1])
);

function collectIconValues(node, out) {
  if (Array.isArray(node)) node.forEach((child) => collectIconValues(child, out));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "icon" && typeof value === "string") out.add(value.trim());
      else collectIconValues(value, out);
    }
  }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (entry.endsWith(".json")) files.push(path);
  }
  return files;
}

const values = new Set();
for (const file of walk(contentDir)) {
  try {
    collectIconValues(JSON.parse(readFileSync(file, "utf8")), values);
  } catch {}
}

const used = [...values]
  .filter((name) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && available.has(toLucideExport(name)))
  .sort();

const exports = used.map(toLucideExport);
const source = `// Generado por scripts/gen-used-icons.mjs — no editar a mano.
import type { IconType } from "react-icons";
${exports.length ? `import { ${exports.join(", ")} } from "react-icons/lu";\n` : ""}
export const USED_ICONS: Record<string, IconType> = {
${used.map((name, i) => `  "${name}": ${exports[i]},`).join("\n")}
};
`;

function writeIfChanged(file, content) {
  let previous = "";
  try {
    previous = readFileSync(file, "utf8");
  } catch {}
  if (previous === content) return;
  // src/icons/ solo contiene archivos ignorados por git: en un clon limpio la carpeta no existe.
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

writeIfChanged(outFile, source);

// Copia del catálogo completo como módulo propio: así el editor puede cargarlo bajo demanda sin
// que Rollup trate `react-icons/lu` como importado dinámicamente y lo meta entero en el bundle.
const catalog = readFileSync(lucideSource, "utf8").replace(
  /import \{ GenIcon \} from ['"]\.\.\/lib\/index\.mjs['"];/,
  'import { GenIcon } from "react-icons";'
);
writeIfChanged(catalogFile, catalog);
console.log(`[gen-used-icons] ${used.length} íconos Lucide usados en el contenido`);
