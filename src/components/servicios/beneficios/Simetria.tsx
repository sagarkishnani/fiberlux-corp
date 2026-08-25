import { useEffect, useRef } from "react";
import { C, Lienzo, pct, ret, useTurno, type PropsIlustracion } from "./base";

/**
 * Plantilla "Simetría" (SPEC 105, imagen 57, card 2).
 *
 * Columnas de igual altura en verde claro con una destacada, y encima la curva
 * del tráfico con su punto en el pico. Las columnas iguales son el argumento de
 * la card: el mismo ancho suba o baje.
 *
 * `datos.barras` manda cuántas columnas hay y `datos.porcentaje` en qué punto
 * del recorrido arranca la destacada. En bucle la destacada va avanzando —el
 * tráfico se mueve— y el punto la sigue POR la curva: recorre el trazado real,
 * no la recta entre un pico y el siguiente (SPEC 17).
 */

/** Duración del viaje del punto de un pico al siguiente, en ms. */
const VIAJE_MS = 900;
/** Pasos de la bisección que ubica cada pico sobre el trazado. */
const BISECCIONES = 24;

/**
 * Longitud de arco a la que cae cada pico dentro del trazado.
 *
 * Se busca por bisección sobre `getPointAtLength` en vez de repartir la
 * longitud total a partes iguales: los tramos de la curva no miden lo mismo
 * —los que suben o bajan más son más largos— y con un reparto uniforme el punto
 * llegaba cerca del pico, pero no encima. La `x` crece de forma monótona a lo
 * largo del trazado, así que la bisección converge siempre.
 */
function anclasDeLaCurva(trazo: SVGPathElement, xs: number[]): number[] {
  const total = trazo.getTotalLength();
  return xs.map((x) => {
    let lo = 0;
    let hi = total;
    for (let k = 0; k < BISECCIONES; k++) {
      const mitad = (lo + hi) / 2;
      if (trazo.getPointAtLength(mitad).x < x) lo = mitad;
      else hi = mitad;
    }
    return (lo + hi) / 2;
  });
}

/** Cada cuánto avanza la columna destacada, en ms. */
const AVANCE_MS = 2600;

/** Caja del gráfico dentro del lienzo. */
const CAJA = { x: 14, y: 18, w: 292, h: 140 };
/** Separación entre columnas. */
const HUECO = 5;

const BARRAS_RESERVA = 7;
const MIN = 5;
const MAX = 9;

/** Curva del tráfico, en tanto por uno de la caja. Es la del diseño: baja,
    sube, vuelve a bajar y remata en el pico antes de caer. */
const PERFIL = [0.52, 0.78, 0.34, 0.6, 0.46, 0.86, 0.3, 0.44, 0.36];

export default function Simetria({ datos, activo }: PropsIlustracion) {
  const pedidas = Number(datos?.barras);
  const barras = Number.isFinite(pedidas)
    ? Math.min(MAX, Math.max(MIN, Math.round(pedidas)))
    : BARRAS_RESERVA;

  const ancho = (CAJA.w - HUECO * (barras - 1)) / barras;
  /* La destacada sale del porcentaje: al 78 % de siete columnas es la sexta,
     que es la que marca el diseño. */
  const arranque = Math.min(barras - 1, Math.round((pct(datos?.porcentaje, 78) / 100) * (barras - 1)));
  const turno = useTurno(barras, activo, AVANCE_MS);
  const destacada = (arranque + turno) % barras;

  /* La curva se muestrea sobre el centro de cada columna, así el pico cae
     siempre encima de una y no entre dos. */
  const puntos = Array.from({ length: barras }, (_, i) => ({
    x: CAJA.x + ancho * i + ancho / 2 + HUECO * i,
    y: CAJA.y + CAJA.h * (1 - PERFIL[i % PERFIL.length]),
  }));

  /* Curva suave por Catmull-Rom convertido a Bézier: con `L` entre puntos
     saldría un zigzag, y el diseño tiene una línea que ondula. */
  const d = puntos
    .map((p, i, todos) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const a = todos[i - 1];
      const previo = todos[i - 2] ?? a;
      const siguiente = todos[i + 1] ?? p;
      const c1 = { x: a.x + (p.x - previo.x) / 6, y: a.y + (p.y - previo.y) / 6 };
      const c2 = { x: p.x - (siguiente.x - a.x) / 6, y: p.y - (siguiente.y - a.y) / 6 };
      return `C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ");

  const pico = puntos[destacada];

  /* El punto viaja POR el trazado (SPEC 17). Antes se movía con una transición
     de `transform` entre las coordenadas de un pico y las del siguiente, y una
     transición de `translate` interpola en RECTA: el punto cruzaba por dentro de
     la onda en vez de recorrerla, que es justo lo que el cliente vio.
     Aquí el recorrido lo marca `getPointAtLength` sobre la curva real, y lo
     avanza un rAF que sólo corre mientras dura el viaje. */
  const trazoRef = useRef<SVGPathElement>(null);
  const puntoRef = useRef<SVGGElement>(null);
  const anclas = useRef<number[]>([]);
  /* Longitud de arco donde está el punto ahora mismo, para que un cambio a
     mitad de viaje arranque desde donde se quedó y no dé un salto. */
  const largoActual = useRef<number | null>(null);

  useEffect(() => {
    const trazo = trazoRef.current;
    const punto = puntoRef.current;
    if (!trazo || !punto) return;

    anclas.current = anclasDeLaCurva(trazo, puntos.map((p) => p.x));
    const destino = anclas.current[destacada];
    if (destino == null) return;

    const colocar = (largo: number) => {
      const p = trazo.getPointAtLength(largo);
      punto.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      largoActual.current = largo;
    };

    /* Primera colocación y movimiento reducido: sin viaje, directo al pico. */
    const sinMovimiento =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (largoActual.current === null || sinMovimiento || !activo) {
      colocar(destino);
      return;
    }

    const origen = largoActual.current;
    if (origen === destino) return;

    let frame = 0;
    let inicio = 0;
    const paso = (ahora: number) => {
      if (!inicio) inicio = ahora;
      const t = Math.min(1, (ahora - inicio) / VIAJE_MS);
      /* Misma salida suave que `.fbx-ben-suave`, que es de donde viene el gesto. */
      const e = 1 - Math.pow(1 - t, 3);
      colocar(origen + (destino - origen) * e);
      if (t < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
    /* `d` en las dependencias: si cambia el número de columnas, el trazado es
       otro y las anclas hay que volver a medirlas. */
  }, [destacada, d, activo]);

  return (
    <Lienzo activo={activo}>
      {/* Entrada y relevo van en nodos distintos. Compartiendo nodo no había
          transición posible: la animación de entrada lleva `fill-mode: both`,
          así que retiene `opacity` para siempre y la propiedad deja de poder
          transicionar. El cambio de columna salía de golpe. */}
      {Array.from({ length: barras }, (_, i) => (
        <g
          key={i}
          className="fbx-ben-sube"
          style={{ "--ret": ret(0.06 + i * 0.05) } as React.CSSProperties}
        >
          <rect
            className="fbx-ben-suave"
            x={CAJA.x + (ancho + HUECO) * i}
            y={CAJA.y}
            width={ancho}
            height={CAJA.h}
            rx="3"
            fill={i === destacada ? C.acentoClaro : C.acentoTenue}
            opacity={i === destacada ? 0.95 : 0.55}
          />
        </g>
      ))}

      <path
        ref={trazoRef}
        className="fbx-ben-traza"
        style={{ "--largo": 420, "--ret": ret(0.4) } as React.CSSProperties}
        d={d}
        fill="none"
        stroke={C.texto}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* El punto se desplaza con `transform`, no moviendo `cx`/`cy`: los
          atributos de geometría de SVG no transicionan.
          El `transform` que sale del servidor deja el punto en su pico, que es
          lo correcto sin JavaScript; a partir de ahí lo lleva el efecto de
          arriba, que lo hace recorrer la curva. Sin `.fbx-ben-suave`: su
          transición de `transform` pelearía con lo que escribe el rAF. */}
      <g className="fbx-ben-punto" style={{ "--ret": ret(1.1) } as React.CSSProperties}>
        <g ref={puntoRef} transform={`translate(${pico.x} ${pico.y})`}>
          <circle r="5.5" fill={C.texto} />
        </g>
      </g>
    </Lienzo>
  );
}
