import { useEffect, useState, type ReactNode } from "react";
import { tField } from "../../../utils/i18n";
import type { Locale } from "../../../i18n/config";

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

/**
 * Etiqueta del CMS en el idioma activo, con fallback al español (SPEC 80).
 *
 * Las etiquetas se dibujan DENTRO del SVG, así que sin esto en /en quedarían
 * en español en medio de una página traducida. `_en` vacío = se usa la ES.
 */
export function L(obj: any, key: string, locale?: string): string {
  return tField(obj, key, (locale === "en" ? "en" : "es") as Locale);
}

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

/**
 * Animaciones compartidas por las catorce plantillas (SPEC 105).
 *
 * Va como constante y no en `src/styles/global.css` porque en este repo ese
 * archivo no se empaqueta: lo que se escriba ahí no llega al navegador. La
 * inyecta `BeneficiosReact` desde su `<style>`.
 *
 * Las catorce comparten esta media docena de animaciones en vez de traer cada
 * una las suyas: lo que cambia entre ellas es el dibujo, no la forma de entrar.
 * Todas arrancan sólo cuando la card ya está en viewport —el componente añade
 * `.fbx-ben-on` al SVG— y una sola vez: pasar el cursor no las rearranca, que
 * en una fila de tres cards convertía el ratón en un interruptor de ruido.
 *
 * `transform-box: fill-box` no sobra en SVG: sin él, `transform-origin: center`
 * se mide contra el lienzo entero y las escalas salen disparadas.
 */
export const CSS_BENEFICIOS = `
/* Trazo que se dibuja. El componente pone \`--largo\` con la longitud del path. */
.fbx-ben-traza {
  stroke-dasharray: var(--largo, 400);
  stroke-dashoffset: var(--largo, 400);
}
.fbx-ben-on .fbx-ben-traza {
  animation: fbx-ben-traza 1.2s cubic-bezier(0.22, 1, 0.36, 1) var(--ret, 0s) both;
}
@keyframes fbx-ben-traza { to { stroke-dashoffset: 0; } }

/* Aparición simple: la usan fondos, tarjetas y textos del dibujo. */
.fbx-ben-aparece { opacity: 0; }
.fbx-ben-on .fbx-ben-aparece {
  animation: fbx-ben-aparece 0.5s ease-out var(--ret, 0s) both;
}
@keyframes fbx-ben-aparece {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Punto que aterriza. */
.fbx-ben-punto {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
}
.fbx-ben-on .fbx-ben-punto {
  animation: fbx-ben-punto 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) var(--ret, 0s) both;
}
@keyframes fbx-ben-punto {
  from { opacity: 0; transform: scale(0.2); }
  to { opacity: 1; transform: scale(1); }
}

/* Giro continuo sobre el centro que fija el componente. La usa la aguja del
   reloj: \`transform-origin\` viene en línea porque depende de su geometría. */
.fbx-ben-on .fbx-ben-gira {
  animation: fbx-ben-gira var(--ciclo, 6s) linear var(--ret, 0s) infinite;
}
@keyframes fbx-ben-gira { to { transform: rotate(360deg); } }

/* Barra que crece desde su borde izquierdo. */
.fbx-ben-barra {
  transform-box: fill-box;
  transform-origin: left center;
  transform: scaleX(0);
}
.fbx-ben-on .fbx-ben-barra {
  animation: fbx-ben-barra 0.8s cubic-bezier(0.22, 1, 0.36, 1) var(--ret, 0s) both;
}
@keyframes fbx-ben-barra { to { transform: scaleX(1); } }

/* Relleno que sube desde su base. La usa el área bajo la curva. */
.fbx-ben-sube {
  transform-box: fill-box;
  transform-origin: bottom center;
  transform: scaleY(0);
  opacity: 0;
}
.fbx-ben-on .fbx-ben-sube {
  animation: fbx-ben-sube 0.9s cubic-bezier(0.22, 1, 0.36, 1) var(--ret, 0s) both;
}
@keyframes fbx-ben-sube { to { transform: scaleY(1); opacity: 1; } }

/* Barajado de la pila de "Velocidad": la tarjeta se desplaza y escala hasta su
   nueva posición en vez de saltar. La transición va sobre \`transform\` porque es
   lo único animable aquí —los atributos \`x\`/\`y\`/\`width\` de SVG no
   transicionan—, y por eso cada tarjeta se posiciona con \`translate\`/\`scale\` y
   no con coordenadas propias. */
.fbx-ben-carta { transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1); }

/* ── Vida en bucle ──
   Lo que se repite NO es el dibujo de entrada: repetirlo se nota forzado, que
   es justo lo que hay que evitar. Lo que sigue vivo es el estado ya dibujado,
   con movimientos largos, de poca amplitud y desfasados entre sí para que nada
   lata al unísono.

   Van sobre elementos que NO llevan clase de entrada: una animación por
   elemento, así que entrada y bucle tienen que vivir en nodos distintos —lo
   normal es la entrada en un \`<g>\` envoltorio y el bucle en la forma. */

/* Guiones que viajan por un trazo: fibras, enlaces, rutas. */
.fbx-ben-on .fbx-ben-flujo {
  animation: fbx-ben-flujo var(--ciclo, 3s) linear var(--ret, 0s) infinite;
}
@keyframes fbx-ben-flujo { to { stroke-dashoffset: var(--flujo, -24); } }

/* Respiración: la opacidad sube y baja poco, muy despacio. */
.fbx-ben-on .fbx-ben-respira {
  animation: fbx-ben-respira var(--ciclo, 5s) ease-in-out var(--ret, 0s) infinite;
}
@keyframes fbx-ben-respira {
  0%, 100% { opacity: var(--o, 1); }
  50% { opacity: calc(var(--o, 1) * 0.5); }
}

/* Destello: un realce breve y espaciado, como una luz que pasa. El grueso del
   ciclo es reposo; sin esa pausa larga se lee como un parpadeo nervioso. */
.fbx-ben-on .fbx-ben-destello {
  animation: fbx-ben-destello var(--ciclo, 6s) ease-in-out var(--ret, 0s) infinite;
}
@keyframes fbx-ben-destello {
  0%, 74%, 100% { opacity: var(--o, 0.35); }
  84% { opacity: 1; }
}

/* Lo que cambia de sitio o de tamaño con el bucle lo hace con transición, no
   con keyframes: el estado lo lleva React y así el salto entre dos valores es
   suave sin tener que declarar la animación entera. */
.fbx-ben-suave {
  transition:
    opacity 900ms ease-in-out,
    fill 900ms ease-in-out,
    stroke 900ms ease-in-out,
    transform 900ms cubic-bezier(0.33, 1, 0.68, 1);
}

/* Latido suave en bucle, para lo que tiene que seguir vivo tras la entrada. */
.fbx-ben-on .fbx-ben-late {
  animation: fbx-ben-late var(--ciclo, 3s) ease-in-out var(--ret, 0s) infinite;
}
@keyframes fbx-ben-late {
  0%, 100% { opacity: var(--o, 1); }
  50% { opacity: calc(var(--o, 1) * 0.45); }
}

/* ── Movimiento reducido ──
   Las catorce ilustraciones aparecen enteras y quietas: trazos cerrados,
   barras a su ancho final, nada latiendo. */
@media (prefers-reduced-motion: reduce) {
  .fbx-ben-on .fbx-ben-traza,
  .fbx-ben-on .fbx-ben-aparece,
  .fbx-ben-on .fbx-ben-gira,
  .fbx-ben-on .fbx-ben-punto,
  .fbx-ben-on .fbx-ben-barra,
  .fbx-ben-on .fbx-ben-sube,
  .fbx-ben-on .fbx-ben-late,
  .fbx-ben-on .fbx-ben-flujo,
  .fbx-ben-on .fbx-ben-respira,
  .fbx-ben-on .fbx-ben-destello {
    animation: none !important;
  }
  .fbx-ben-suave { transition: none !important; }
  /* Los estados de reposo se resetean sobre la clase desnuda: si el
     observador no llegara a disparar, el dibujo tiene que verse igual. */
  .fbx-ben-traza { stroke-dashoffset: 0 !important; }
  .fbx-ben-aparece,
  .fbx-ben-punto,
  .fbx-ben-sube { opacity: 1 !important; }
  .fbx-ben-punto,
  .fbx-ben-barra,
  .fbx-ben-sube { transform: none !important; }
  /* El barajado se queda sin transición: la tarjeta elegida aparece ya puesta.
     El turno automático no llega ni a arrancar, lo corta \`useTurno\`. */
  .fbx-ben-carta { transition: none !important; }
}
`;
