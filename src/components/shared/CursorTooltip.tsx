import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Tooltip que sigue al cursor con retraso — el mismo que ya usaba el bloque de
 * soluciones (SPEC 89/103), extraído aquí para poder reutilizarlo.
 *
 * Dos detalles que obligan a que sea un componente y no cuatro clases sueltas:
 *
 * 1) Va por un PORTAL a `document.body`. El tooltip es `position: fixed`, y un
 *    ancestro con `transform` (el contenedor de Embla lo lleva mientras el
 *    carrusel se mueve) se convierte en su bloque contenedor: dentro del
 *    carrusel el `fixed` dejaría de referirse al viewport y el tooltip
 *    aparecería desplazado y recortado. El portal lo saca de ese subárbol.
 *
 * 2) La posición se escribe por `ref` dentro de un bucle de `requestAnimationFrame`,
 *    no por estado: si cada `mousemove` provocara un render, el componente que
 *    lo usa (una card con foto) se repintaría decenas de veces por segundo.
 *    Sólo hay render al aparecer y al desaparecer.
 *
 * Aparece únicamente en punteros finos (en táctil no hay hover que valga) y
 * respeta `prefers-reduced-motion`: sin interpolación, se coloca directo.
 *
 * El aspecto es la píldora clara translúcida con el glifo de retorno (↵) que
 * pidió el cliente: se centra sobre el cursor, no se cuelga a un lado.
 */

/** Retraso antes de mostrarlo: evita que parpadee al cruzar el elemento. */
const RETRASO_MS = 140;
/** Factor del lerp: cuanto más chico, más se descuelga del cursor. */
const LAG = 0.06;

export interface CursorTooltip {
  /** Handlers a repartir sobre el elemento que dispara el tooltip. */
  handlers: {
    onMouseEnter: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
  };
  /** Nodo del tooltip; hay que incluirlo en el JSX (se renderiza por portal). */
  tooltip: React.ReactNode;
}

export function useCursorTooltip(label: string): CursorTooltip {
  const nodoRef = useRef<HTMLDivElement | null>(null);
  const destino = useRef({ x: 0, y: 0 });
  const actual = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const retraso = useRef<number | null>(null);
  const punteroFino = useRef(false);
  const sinMovimiento = useRef(false);

  const [visible, setVisible] = useState(false);
  /* El portal sólo puede montarse en cliente: en SSR no hay `document`. */
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    punteroFino.current = window.matchMedia?.("(pointer: fine)").matches ?? false;
    sinMovimiento.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      if (retraso.current != null) clearTimeout(retraso.current);
    };
  }, []);

  const colocar = () => {
    const el = nodoRef.current;
    if (el) el.style.transform = `translate3d(${actual.current.x}px, ${actual.current.y}px, 0)`;
  };

  const bucle = () => {
    actual.current.x += (destino.current.x - actual.current.x) * LAG;
    actual.current.y += (destino.current.y - actual.current.y) * LAG;
    colocar();
    raf.current = requestAnimationFrame(bucle);
  };

  const onMouseEnter = (e: React.MouseEvent) => {
    if (!punteroFino.current) return;
    destino.current = { x: e.clientX, y: e.clientY };
    actual.current = { ...destino.current };
    colocar();
    if (retraso.current != null) clearTimeout(retraso.current);
    retraso.current = window.setTimeout(() => {
      setVisible(true);
      if (!sinMovimiento.current && raf.current == null) {
        raf.current = requestAnimationFrame(bucle);
      }
    }, RETRASO_MS);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!punteroFino.current) return;
    destino.current = { x: e.clientX, y: e.clientY };
    /* Sin animación el tooltip no persigue: se pega al cursor en el acto. */
    if (sinMovimiento.current) {
      actual.current = { ...destino.current };
      colocar();
    }
  };

  const onMouseLeave = () => {
    if (retraso.current != null) {
      clearTimeout(retraso.current);
      retraso.current = null;
    }
    setVisible(false);
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  const tooltip = montado
    ? createPortal(
        /* Dos nodos a propósito: el de fuera lleva la posición del cursor
           (`transform`, escrito desde el bucle de animación) y el de dentro el
           centrado sobre ese punto y el fundido. Si fueran uno solo, el
           `translate(-50%,-50%)` del centrado y el `translate3d` del
           seguimiento se pisarían en la misma propiedad. */
        <div
          ref={nodoRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[70] hidden select-none lg:block"
          style={{ transform: "translate3d(-200px, -200px, 0)" }}
        >
          <div
            className={`-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-white/85 px-3.5 py-1.5 text-[13px] font-medium text-[#3B0E30] shadow-lg backdrop-blur-md transition-opacity duration-200 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <span aria-hidden="true" className="mr-1">↵</span>
            {label}
          </div>
        </div>,
        document.body
      )
    : null;

  return { handlers: { onMouseEnter, onMouseMove, onMouseLeave }, tooltip };
}
