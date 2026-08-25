import { useEffect, useState } from "react";
import { C, L, Lienzo, pct, type PropsIlustracion } from "./base";

/**
 * Plantilla "Velocidad" (SPEC 105, imagen 61, card 1).
 *
 * Tarjetas blancas apiladas. La de delante enseña su anillo y su texto; las de
 * atrás asoman por arriba, tapadas a medias.
 *
 * Se turnan solas —con la pila quieta, el contenido de la de atrás no se veía
 * nunca— y además se pueden elegir: al pulsar una, pasa al frente y el turno
 * automático se detiene, porque seguir rotando sería quitarle de las manos a
 * quien acaba de elegir.
 *
 * El relevo se anima como una baraja: cada tarjeta tiene SIEMPRE la misma caja
 * y lo que cambia es su `transform`, que sí se puede transicionar. Con las
 * coordenadas metidas en `x`/`y`/`width` no había nada que animar —los
 * atributos de SVG no transicionan— y el cambio salía a saltos.
 */

/** Caja de cada tarjeta. Todas miden igual; la profundidad la da la escala. */
const CARTA = { w: 224, h: 78 };

/** Dónde y a qué escala se dibuja cada tarjeta según su profundidad.
    Los escalones son cortos a propósito: en el diseño la de atrás sólo asoma
    una franja, lo justo para que se vea que hay más de una. */
const POSICIONES = [
  { x: 34, y: 68, escala: 1 },
  { x: 47, y: 34, escala: 0.92 },
  { x: 59, y: 6, escala: 0.85 },
];

/** Radio y grosor del anillo. */
const R = 19;
const GROSOR = 5.5;
const VUELTA = 2 * Math.PI * R;

/** Cada cuánto pasa al fondo la tarjeta de delante, en ms. */
const RELEVO_MS = 4200;

/** Un acento por tarjeta, para que se distingan al barajarse. Los tres son
    pasos de la misma escala morada: un color de fuera partiría la marca. */
const ACENTOS = [C.acentoClaro, "#e8a8d4", C.acento];

/** Reserva cuando el editor no ha escrito nada. */
const RESERVA = [
  { etiqueta: "Velocidad sin caídas", porcentaje: 78 },
  { etiqueta: "Ancho garantizado", porcentaje: 54 },
];

/** Parte el texto en dos renglones: SVG no envuelve solo. */
function enDosLineas(texto: string) {
  const palabras = texto.split(/\s+/);
  const corte = Math.ceil(palabras.length / 2);
  return [palabras.slice(0, corte).join(" "), palabras.slice(corte).join(" ")];
}

export default function Velocidad({ datos, activo, locale }: PropsIlustracion) {
  /* Compatibilidad con los campos sueltos de antes. */
  const desdeCms: any[] = (datos?.tarjetas ?? []).filter(Boolean);
  const tarjetas = desdeCms.length
    ? desdeCms
    : datos?.etiqueta || datos?.porcentaje != null
      ? [{ etiqueta: datos?.etiqueta, porcentaje: datos?.porcentaje }, RESERVA[1]]
      : RESERVA;

  const [frente, setFrente] = useState(0);
  const [elegida, setElegida] = useState(false);

  useEffect(() => {
    if (!activo || elegida || tarjetas.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setFrente((f) => (f + 1) % tarjetas.length), RELEVO_MS);
    return () => clearInterval(id);
  }, [activo, elegida, tarjetas.length]);

  const elegir = (i: number) => {
    setElegida(true);
    setFrente(i);
  };

  /* El orden de pintado es el de apilado: en SVG no hay `z-index`, manda el
     orden en el DOM. Reordenar con `key` estable mueve los nodos sin
     desmontarlos, que es lo que deja viva la transición. */
  const enOrden = tarjetas
    .map((tarjeta: any, i: number) => ({
      tarjeta,
      i,
      profundidad: (i - frente + tarjetas.length) % tarjetas.length,
    }))
    .sort((a: any, b: any) => b.profundidad - a.profundidad);

  return (
    <Lienzo activo={activo}>
      <defs>
        <filter id="ben-vel-sombra" x="-20%" y="-20%" width="140%" height="140%">
          {/* Sobre negro una sombra no se lee: lo que separa la tarjeta del fondo
              es un halo morado, no un oscurecido. */}
          <feDropShadow dx="0" dy="3" stdDeviation="7" floodColor={C.acento} floodOpacity="0.5" />
        </filter>
      </defs>

      {/* La entrada va en un envoltorio que NUNCA se reordena. Estaba en cada
          tarjeta, y como el barajado las mueve de sitio en el DOM, el navegador
          reiniciaba su animación en cada relevo y se quedaban clavadas en el
          primer fotograma, es decir invisibles. */}
      <g className="fbx-ben-aparece">
        {enOrden.map(({ tarjeta, i, profundidad }: any) => {
          const pos = POSICIONES[Math.min(profundidad, POSICIONES.length - 1)];
          const acento = ACENTOS[i % ACENTOS.length];
          const porcentaje = pct(tarjeta?.porcentaje, 78);
          const largo = (VUELTA * porcentaje) / 100;
          const alFrente = profundidad === 0;
          const [linea1, linea2] = enDosLineas(L(tarjeta, "etiqueta", locale) || "Velocidad sin caídas");

          return (
            <g
              key={i}
              className="fbx-ben-carta"
              transform={`translate(${pos.x} ${pos.y}) scale(${pos.escala})`}
              style={{ cursor: alFrente ? "default" : "pointer" }}
              onClick={alFrente ? undefined : () => elegir(i)}
            >
              <rect
                width={CARTA.w}
                height={CARTA.h}
                rx="15"
                /* Opaco a propósito: la tarjeta de delante tiene que tapar a la
                   de atrás, que es lo que hace legible la pila. */
                fill={C.panelSolido}
                stroke={C.panelBorde}
                strokeWidth="1.2"
                filter="url(#ben-vel-sombra)"
              />

              <g transform={`translate(40 ${CARTA.h / 2})`}>
                <circle r={R} fill="none" stroke={C.tenue} strokeWidth={GROSOR} />
                <circle
                  r={R}
                  fill="none"
                  stroke={acento}
                  strokeWidth={GROSOR}
                  strokeLinecap="round"
                  transform="rotate(-90)"
                  strokeDasharray={`${largo} ${VUELTA}`}
                />
                <path d="M 1.5 -8 L -4.5 1 L 0 1 L -1.5 8 L 4.5 -1 L 0 -1 Z" fill={C.acentoClaro} />
              </g>

              {/* El texto va siempre: a las de atrás se lo recorta la tarjeta de
                  delante, que es justo el efecto del diseño. */}
              <g fill={C.texto} fontSize="13" fontWeight="600">
                <text x="72" y={CARTA.h / 2 - 4}>
                  {linea1}
                </text>
                <text x="72" y={CARTA.h / 2 + 14}>
                  {linea2}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </Lienzo>
  );
}
