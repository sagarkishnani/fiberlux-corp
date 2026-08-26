import type { ReactNode } from "react";

/**
 * Piezas compartidas por las cuatro escenas de la sección de soluciones
 * (SPEC 108).
 *
 * Reusan la paleta `C` y los helpers de las ilustraciones de Beneficios
 * (SPEC 105/107) —misma línea gráfica— pero con caja propia: aquí el dibujo
 * ocupa la mitad de una card, no el pie de una tarjeta, así que el lienzo es
 * 400×320 en vez de 320×180.
 *
 * Diferencia de fondo con Beneficios: allá las animaciones corren UNA vez
 * cuando la card entra en viewport; acá corren en BUCLE mientras la card está
 * en pantalla y se pausan al salir (`.fbx-sol-on` → `animation-play-state`).
 */

export { C, u, ret, useReducido } from "../../servicios/beneficios/base";

export interface PropsEscena {
  /** La card está en viewport: las animaciones corren. Si no, quedan pausadas. */
  activo: boolean;
  /** Idioma activo, para los textos que las escenas dibujan por dentro. */
  locale?: string;
}

/** Caja de las cuatro escenas, en unidades del lienzo. */
export const VB = { w: 400, h: 320 };

/**
 * Envoltorio común. Declara el contenedor de consulta y `--u` = una unidad del
 * lienzo de 400, para que `u(24)` signifique lo mismo en la mitad de una card
 * de 640 px que en el ancho completo de un móvil.
 *
 * `--u` va en el div interior y no en el exterior porque `cqw` se mide contra
 * el contenedor MÁS CERCANO, y en el propio elemento que lo declara ese
 * contenedor sería el de fuera (misma trampa que en SPEC 107).
 */
export function EscenaSol({
  activo,
  className = "",
  children,
}: {
  activo: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`fbx-sol-escena ${className}${activo ? " fbx-sol-on" : ""}`}
      aria-hidden="true"
    >
      <div className="fbx-sol-escena-in">{children}</div>
    </div>
  );
}

/**
 * Animaciones de las cuatro escenas (SPEC 108).
 *
 * Va como constante y no en `src/styles/global.css` porque ese archivo no se
 * empaqueta en este repo: lo que se escriba ahí no llega al navegador. La
 * inyecta `SolucionesStackReact` desde su `<style>`, igual que
 * `BeneficiosReact` hace con `CSS_BENEFICIOS`.
 *
 * Todas las animaciones se declaran `infinite` y **pausadas**; sólo corren
 * dentro de `.fbx-sol-on`, que el componente enciende cuando la card entra en
 * viewport. Con `prefers-reduced-motion: reduce` se quedan pausadas siempre, y
 * como cada `@keyframes` arranca en el estado de reposo visible, la escena se
 * ve completa y quieta.
 */
export const CSS_SOLUCIONES = `
.fbx-sol-escena {
  position: relative;
  width: 100%;
  aspect-ratio: ${VB.w} / ${VB.h};
  container-type: inline-size;
}
.fbx-sol-escena-in {
  position: absolute;
  inset: 0;
  --u: calc(100cqw / ${VB.w});
}
@supports not (container-type: inline-size) {
  .fbx-sol-escena-in { --u: 1px; }
}

/* Interruptor común: todo lo que anime dentro de una escena arranca pausado y
   sólo corre cuando la card está en pantalla. */
.fbx-sol-escena [class*="fbx-sol-anim"] { animation-play-state: paused; }
.fbx-sol-on [class*="fbx-sol-anim"] { animation-play-state: running; }
@media (prefers-reduced-motion: reduce) {
  .fbx-sol-on [class*="fbx-sol-anim"] { animation-play-state: paused; }
}

/* ── Órbita (conectividad) ── */
.fbx-sol-anim-orbita {
  animation: fbx-sol-orbita var(--ciclo, 12s) linear infinite;
  transform-origin: 0 0;
}
@keyframes fbx-sol-orbita { to { transform: rotate(360deg); } }

.fbx-sol-anim-respira {
  animation: fbx-sol-respira var(--ciclo, 4s) ease-in-out var(--ret, 0s) infinite;
}
@keyframes fbx-sol-respira {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.08); }
}

.fbx-sol-anim-anillo {
  animation: fbx-sol-anillo var(--ciclo, 5s) ease-out var(--ret, 0s) infinite;
}
@keyframes fbx-sol-anillo {
  0%   { opacity: 0.5; transform: scale(0.82); }
  70%  { opacity: 0;   transform: scale(1.12); }
  100% { opacity: 0;   transform: scale(1.12); }
}

/* ── Bitácora (ciberseguridad) ── */
/* El realce recorre las filas: cada una anima el mismo ciclo con su propio
   `--ret`, así que la ventana encendida (≈1/6 del ciclo) baja fila por fila.
   Se animan las propiedades reales —fondo, opacidad, glow del badge— y no una
   custom property, que sin `@property` no es animable. */
.fbx-sol-anim-filaBg {
  animation: fbx-sol-filaBg var(--ciclo, 8.4s) linear var(--ret, 0s) infinite;
}
@keyframes fbx-sol-filaBg {
  0%, 2%    { background: transparent; box-shadow: none; }
  4%, 14%   { background: var(--activa); box-shadow: 0 0 0 1px var(--borde-activo) inset; }
  18%, 100% { background: transparent; box-shadow: none; }
}
.fbx-sol-anim-filaTxt {
  animation: fbx-sol-filaTxt var(--ciclo, 8.4s) linear var(--ret, 0s) infinite;
}
@keyframes fbx-sol-filaTxt {
  0%, 2%    { opacity: 0.55; }
  4%, 14%   { opacity: 1; }
  18%, 100% { opacity: 0.55; }
}
.fbx-sol-anim-badge {
  animation: fbx-sol-badge var(--ciclo, 8.4s) linear var(--ret, 0s) infinite;
}
@keyframes fbx-sol-badge {
  0%, 2%    { box-shadow: none; }
  4%, 14%   { box-shadow: 0 0 var(--glow, 10px) var(--brillo); }
  18%, 100% { box-shadow: none; }
}

/* ── Nube (data center) ── */
/* Paquete que sube por la línea punteada hacia el tile. */
.fbx-sol-anim-paquete {
  animation: fbx-sol-paquete var(--ciclo, 2.6s) cubic-bezier(0.4, 0, 0.2, 1) var(--ret, 0s) infinite;
}
@keyframes fbx-sol-paquete {
  0%   { opacity: 0; transform: translateY(0); }
  12%  { opacity: 1; }
  78%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(var(--viaje, -80px)); }
}
/* Barra de rack que se enciende cuando le toca el turno. */
.fbx-sol-anim-rack {
  animation: fbx-sol-rack var(--ciclo, 7.8s) linear var(--ret, 0s) infinite;
}
@keyframes fbx-sol-rack {
  0%, 4%    { border-color: var(--apagado); background: var(--fondo-off); }
  8%, 22%   { border-color: var(--encendido); background: var(--fondo-on); }
  28%, 100% { border-color: var(--apagado); background: var(--fondo-off); }
}

/* ── Waveform (servicios gestionados) ── */
.fbx-sol-anim-barra {
  animation: fbx-sol-barra var(--ciclo, 1.4s) ease-in-out var(--ret, 0s) infinite alternate;
  transform-origin: 50% 50%;
}
@keyframes fbx-sol-barra {
  from { transform: scaleY(var(--min, 0.35)); }
  to   { transform: scaleY(1); }
}
.fbx-sol-anim-foco {
  animation: fbx-sol-foco var(--ciclo, 6s) ease-in-out var(--ret, 0s) infinite;
}
@keyframes fbx-sol-foco {
  0%, 26%   { transform: translateX(var(--p0, 0)); }
  33%, 59%  { transform: translateX(var(--p1, 0)); }
  66%, 92%  { transform: translateX(var(--p2, 0)); }
  100%      { transform: translateX(var(--p0, 0)); }
}
`;
