import React, { useMemo, useState } from "react";
import type { IconType } from "react-icons";
import * as Lucide from "react-icons/lu";

export interface LegacyIconOption {
  value: string;
  label?: string;
}

interface IconFieldOptions {
  name?: string;
  label?: string;
  description?: string;
  legacy?: (LegacyIconOption | string)[];
}

const MAX_RESULTS = 120;

const ES_ALIASES: Record<string, string[]> = {
  escudo: ["shield"],
  seguridad: ["shield", "lock"],
  candado: ["lock"],
  llave: ["key"],
  documento: ["file", "scroll"],
  archivo: ["file", "folder"],
  carpeta: ["folder"],
  certificado: ["badge", "award", "file-badge"],
  premio: ["award", "trophy"],
  balanza: ["scale"],
  legal: ["scale", "gavel"],
  ley: ["scale", "gavel"],
  portapapeles: ["clipboard"],
  correo: ["mail"],
  email: ["mail"],
  telefono: ["phone"],
  llamada: ["phone"],
  celular: ["smartphone"],
  movil: ["smartphone"],
  ubicacion: ["map-pin", "map"],
  mapa: ["map"],
  direccion: ["map-pin", "navigation"],
  casa: ["house", "home"],
  hogar: ["house", "home"],
  edificio: ["building"],
  empresa: ["building", "briefcase"],
  oficina: ["building", "briefcase"],
  usuario: ["user"],
  persona: ["user"],
  personas: ["users"],
  clientes: ["users", "handshake"],
  equipo: ["users", "laptop"],
  reloj: ["clock", "timer"],
  tiempo: ["clock", "timer", "hourglass"],
  calendario: ["calendar"],
  fecha: ["calendar"],
  nube: ["cloud"],
  red: ["network", "wifi", "globe"],
  internet: ["globe", "wifi", "earth"],
  mundo: ["globe", "earth"],
  globo: ["globe", "earth"],
  senal: ["signal", "radio"],
  antena: ["antenna", "radio-tower"],
  satelite: ["satellite"],
  fibra: ["cable", "zap"],
  cable: ["cable", "plug"],
  rayo: ["zap"],
  energia: ["zap", "battery", "plug"],
  bateria: ["battery"],
  grafico: ["chart"],
  estadistica: ["chart"],
  dinero: ["banknote", "dollar", "wallet"],
  pago: ["credit-card", "wallet", "banknote"],
  tarjeta: ["credit-card"],
  factura: ["receipt"],
  carrito: ["shopping-cart"],
  tienda: ["store", "shopping"],
  estrella: ["star"],
  corazon: ["heart"],
  ojo: ["eye"],
  ver: ["eye"],
  buscar: ["search"],
  lupa: ["search", "scan-search"],
  configuracion: ["settings", "cog", "sliders"],
  ajustes: ["settings", "sliders"],
  engranaje: ["cog", "settings"],
  herramienta: ["wrench", "hammer"],
  alerta: ["alert", "triangle-alert", "bell"],
  aviso: ["bell", "megaphone"],
  campana: ["bell"],
  ayuda: ["help", "life-buoy"],
  soporte: ["headset", "life-buoy", "headphones"],
  auricular: ["headphones", "headset"],
  informacion: ["info"],
  check: ["check"],
  listo: ["check", "circle-check"],
  servidor: ["server"],
  datos: ["database"],
  "base de datos": ["database"],
  computadora: ["monitor", "laptop", "computer"],
  laptop: ["laptop"],
  pantalla: ["monitor", "screen"],
  chat: ["message"],
  mensaje: ["message"],
  descarga: ["download"],
  descargar: ["download"],
  subir: ["upload"],
  flecha: ["arrow", "chevron"],
  camara: ["camera", "cctv"],
  video: ["video"],
  videovigilancia: ["cctv", "camera"],
  cohete: ["rocket"],
  objetivo: ["target"],
  meta: ["target", "flag"],
  idea: ["lightbulb"],
  foco: ["lightbulb"],
  innovacion: ["lightbulb", "sparkles", "rocket"],
  brillo: ["sparkles", "sun"],
  sol: ["sun"],
  pulso: ["activity", "heart-pulse"],
  monitoreo: ["activity", "monitor", "radar"],
  salud: ["heart-pulse", "stethoscope", "hospital"],
  educacion: ["graduation-cap", "book", "school"],
  libro: ["book"],
  mineria: ["pickaxe", "mountain"],
  industria: ["factory"],
  fabrica: ["factory"],
  banco: ["landmark"],
  banca: ["landmark", "banknote"],
  restaurante: ["utensils", "chef-hat"],
  comida: ["utensils"],
  transporte: ["truck", "bus", "car"],
  camion: ["truck"],
  avion: ["plane"],
  telescopio: ["telescope"],
  diamante: ["gem"],
  apoyo: ["handshake", "hand-heart"],
  manos: ["handshake", "hand"],
  hoja: ["leaf"],
  planta: ["leaf", "sprout"],
  agua: ["droplet", "waves"],
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

function toLucideExport(name: string) {
  return "Lu" + name.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
}

function toKebab(exportName: string) {
  return exportName
    .slice(2)
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

const LUCIDE_ICONS = Lucide as unknown as Record<string, IconType>;

let catalog: { name: string; Icon: IconType }[] | null = null;
function getCatalog() {
  catalog ??= Object.keys(LUCIDE_ICONS)
    .filter((key) => key.startsWith("Lu") && typeof LUCIDE_ICONS[key] === "function")
    .map((key) => ({ key, name: toKebab(key) }))
    .filter(({ key, name }) => toLucideExport(name) === key)
    .map(({ key, name }) => ({ name, Icon: LUCIDE_ICONS[key] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return catalog;
}

function searchTerms(query: string) {
  const q = normalize(query);
  if (!q) return [];
  const terms = new Set([q.replace(/\s+/g, "-")]);
  for (const [alias, targets] of Object.entries(ES_ALIASES)) {
    if (alias.startsWith(q) || (q.length >= 4 && q.startsWith(alias))) targets.forEach((t) => terms.add(t));
  }
  return [...terms];
}

const styles = {
  wrap: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 600, color: "#433E52" } as React.CSSProperties,
  description: { fontSize: 12, color: "#8A8597", margin: 0 } as React.CSSProperties,
  current: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #E1DDEC", borderRadius: 8, background: "#fff" } as React.CSSProperties,
  currentIcon: { display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 8, background: "#FAF0F6", color: "#96217A", flexShrink: 0 } as React.CSSProperties,
  input: { width: "100%", padding: "8px 10px", border: "1px solid #E1DDEC", borderRadius: 8, fontSize: 14 } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: 6, maxHeight: 280, overflowY: "auto", padding: 2 } as React.CSSProperties,
  cell: { display: "grid", placeItems: "center", height: 44, border: "1px solid #E1DDEC", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#433E52" } as React.CSSProperties,
  chip: { padding: "4px 10px", border: "1px solid #E1DDEC", borderRadius: 999, background: "#fff", fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  link: { marginLeft: "auto", border: 0, background: "none", color: "#96217A", fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  muted: { fontSize: 12, color: "#8A8597" } as React.CSSProperties,
};

function IconPicker({ input, field, legacy }: { input: { value?: string; onChange: (value: string) => void }; field: { label?: string; description?: string }; legacy: LegacyIconOption[] }) {
  const [query, setQuery] = useState("");
  const value = (input.value || "").trim();
  const all = getCatalog();

  const results = useMemo(() => {
    const terms = searchTerms(query);
    const matches = terms.length ? all.filter(({ name }) => terms.some((term) => name.includes(term))) : all;
    return { total: matches.length, items: matches.slice(0, MAX_RESULTS) };
  }, [query, all]);

  const legacyMatch = legacy.find((option) => option.value === value);
  const CurrentIcon = legacyMatch ? null : all.find((icon) => icon.name === value)?.Icon;

  return (
    <div style={styles.wrap}>
      <span style={styles.label}>{field.label || "Ícono"}</span>
      {field.description && <p style={styles.description}>{field.description}</p>}

      <div style={styles.current}>
        <span style={styles.currentIcon}>{CurrentIcon ? <CurrentIcon size={20} strokeWidth={1.75} /> : <span style={{ fontSize: 11 }}>{value ? "Aa" : "—"}</span>}</span>
        <span style={{ fontSize: 13 }}>
          {value ? (legacyMatch ? `${legacyMatch.label || value} (ícono actual)` : value) : "Sin ícono"}
        </span>
        {value && (
          <button type="button" style={styles.link} onClick={() => input.onChange("")}>
            Quitar
          </button>
        )}
      </div>

      {legacy.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ ...styles.muted, width: "100%" }}>Íconos actuales de esta sección</span>
          {legacy.map((option) => (
            <button
              key={option.value}
              type="button"
              style={{ ...styles.chip, ...(option.value === value ? { border: "1px solid #96217A", color: "#96217A" } : {}) }}
              onClick={() => input.onChange(option.value)}
            >
              {option.label || option.value}
            </button>
          ))}
        </div>
      )}

      <input
        type="search"
        style={styles.input}
        placeholder="Buscar en Lucide (ej. escudo, shield, documento, correo)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <span style={styles.muted}>
        {results.total} íconos{results.total > MAX_RESULTS ? ` · se muestran ${MAX_RESULTS}, afina la búsqueda` : ""} · catálogo en lucide.dev
      </span>
      <div style={styles.grid}>
        {results.items.map(({ name, Icon }) => (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            style={{ ...styles.cell, ...(name === value ? { border: "1px solid #96217A", color: "#96217A", background: "#FAF0F6" } : {}) }}
            onClick={() => input.onChange(name)}
          >
            <Icon size={20} strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function iconField(opts: IconFieldOptions = {}) {
  const legacy = (opts.legacy || []).map((option) => (typeof option === "string" ? { value: option } : option));
  return {
    name: opts.name ?? "icon",
    label: opts.label ?? "Ícono",
    type: "string" as const,
    description: opts.description,
    ui: {
      component: (props: any) => <IconPicker {...props} legacy={legacy} />,
    },
  };
}
