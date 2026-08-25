import { useEffect, useState, type ReactNode } from "react";

/**
 * Piezas compartidas por las catorce plantillas de ilustración (SPEC 105).
 *
 * Viven aparte del registro a propósito: el registro importa las catorce
 * plantillas y las catorce necesitan estas constantes, así que tenerlas ahí
 * cerraba un ciclo de imports. Con la pila de "Velocidad" —que lee `C` al
 * evaluar el módulo, no al renderizar— el ciclo dejaba de ser inofensivo y
 * reventaba con `Cannot read properties of undefined`.
 */

export interface PropsIlustracion {
  /** El objeto `datos` de la card, tal cual viene del CMS. Puede ser nulo. */
  datos?: any;
  /** La card ya entró en viewport: es la señal para animarse. Una sola vez. */
  activo: boolean;
  /** Idioma activo, para las etiquetas que el editor escribe en Tina. */
  locale?: string;
}

/** Caja común de las catorce, la del pie de la card en el diseño. */
export const VB = { w: 320, h: 180 };

/**
 * Envoltorio SVG común. Centraliza el `viewBox`, el `aria-hidden` y el
 * interruptor `.fbx-ben-on`, que es lo que arranca las animaciones cuando la
 * card ya está en pantalla.
 */
export function Lienzo({ activo, children }: { activo: boolean; children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className={`mt-6 w-full${activo ? " fbx-ben-on" : ""}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Retraso de una animación, listo para meter en `--ret`. */
export const ret = (segundos: number) => `${segundos.toFixed(2)}s`;

/**
 * Paleta de las ilustraciones (SPEC 105, sección 3.3).
 *
 * Las plantillas vienen de un proyecto con fondo claro y acento verde; aquí
 * dibujan sobre el `greyscale-darkest` de la sección, así que la jerarquía se
 * invierte: lo que allí era tinta oscura aquí es morado claro, y las tarjetas
 * blancas pasan a ser paneles translúcidos.
 *
 * Regla que se mantiene: lo apagado es el MISMO color a menos opacidad, nunca
 * otro color. Así cada ilustración se lee como una pieza y no como dos objetos.
 */
export const C = {
  /** brand-purple. Trazo principal y rellenos con cuerpo. */
  acento: "#96237A",
  /** Realces y estados encendidos: lo que tiene que verse sobre negro. */
  acentoClaro: "#c65fac",
  /** brand-purple-dark. Rellenos de fondo y sombras. */
  acentoOscuro: "#650F50",
  /** Lo que está "off": misma familia, sin color. */
  apagado: "rgba(255,255,255,0.28)",
  /** Rejillas, ejes y guías. */
  tenue: "rgba(255,255,255,0.12)",
  /** Etiquetas dentro del SVG. */
  texto: "rgba(255,255,255,0.75)",
  /** greyscale-darkest: el fondo de la sección. */
  fondo: "#0A0A0A",

  /* Derivados de los siete de arriba, para las plantillas que dibujan cajas
     o degradados y necesitan un paso intermedio. */
  /** Morado a media asta: tintes suaves y trazos secundarios. */
  acentoTenue: "rgba(198,95,172,0.45)",
  /** Relleno de área muy suave, el equivalente al lavado de color. */
  acentoRelleno: "rgba(150,35,122,0.18)",
  /** Etiquetas secundarias. */
  textoTenue: "rgba(255,255,255,0.45)",
  /** Fondo de las tarjetas que la ilustración dibuja dentro de la card. */
  panel: "rgba(255,255,255,0.06)",
  /** Borde de esas tarjetas. */
  panelBorde: "rgba(255,255,255,0.14)",
};

/** Recorta un porcentaje del CMS al rango dibujable. */
export function pct(valor: unknown, reserva: number): number {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return reserva;
  return Math.min(100, Math.max(0, n));
}

/**
 * Ancho aproximado de un texto, para dimensionar la caja que lo envuelve.
 *
 * En SVG una caja no se ajusta sola a su contenido: hay que darle un `width`.
 * Con etiquetas fijas eso daba igual, pero desde que el editor las escribe en
 * Tina una palabra larga se sale de su caja. La estimación no es exacta ni lo
 * pretende: basta con que la caja nunca quede corta.
 *
 * `factor` es la anchura media de un glifo respecto al cuerpo de la fuente.
 * Poppins ronda 0.60 en caja mixta y 0.62 en versalitas, que son más anchas.
 */
export function anchoTexto(texto: string, cuerpo: number, factor = 0.6, tracking = 0): number {
  return (texto ?? "").length * (cuerpo * factor + tracking);
}

/**
 * Ancho de caja y cuerpo de letra para una columna de etiquetas.
 *
 * Primero intenta ensanchar la caja hasta que quepa la etiqueta más larga. Si
 * ni con el ancho máximo entra —el editor puede escribir lo que quiera—, en vez
 * de recortar el texto baja el cuerpo de la letra de toda la columna, para que
 * las etiquetas sigan midiendo lo mismo entre sí.
 */
export function cajaEtiquetas(
  etiquetas: string[],
  { cuerpo, minimo, maximo, sangria }: { cuerpo: number; minimo: number; maximo: number; sangria: number }
): { ancho: number; cuerpo: number } {
  const masLarga = Math.max(0, ...etiquetas.map((e) => anchoTexto(e, cuerpo)));
  const ancho = Math.min(maximo, Math.max(minimo, sangria + masLarga));
  const disponible = ancho - sangria;
  /* Nunca por debajo de 9: más pequeño deja de leerse en móvil. */
  const ajustado = masLarga > disponible ? Math.max(9, (cuerpo * disponible) / masLarga) : cuerpo;
  return { ancho, cuerpo: ajustado };
}

/**
 * Índice que va rotando, para las ilustraciones cuyo bucle es un cambio de
 * estado y no un movimiento continuo: la ruta activa de "Conmutación", la
 * columna destacada de "Simetría".
 *
 * Sólo gira cuando la card ya se ve —no tiene sentido animar lo que nadie
 * mira— y nunca con movimiento reducido.
 */
export function useTurno(total: number, activo: boolean, ms: number): number {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!activo || total < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % total), ms);
    return () => clearInterval(id);
  }, [activo, total, ms]);

  return i;
}
