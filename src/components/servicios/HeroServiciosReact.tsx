import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { buttonClass } from "../shared/Button";
import type {
  ServiciosQuery,
  ServiciosQueryVariables,
} from "../../../tina/__generated__/types";
import CinematicRays, { type CinematicRaysHandle } from "../effects/CinematicRays";
import NodeField from "../effects/NodeField";
import { tField, localizedPath } from "../../utils/i18n";
import { t } from "../../i18n/ui";
import type { Locale } from "../../i18n/config";

interface HeroServiciosProps {
  query: string;
  variables: ServiciosQueryVariables;
  data: ServiciosQuery;
  locale?: Locale;
}

/* Claves de icono (mapeadas en CinematicRays) de las 5 categorías de solución.
   El efecto las mezcla con iconos extra para dar variedad a los tiles. */
const ICON_KEYS = [
  "conectividad",
  "ciberseguridad",
  "datacenter",
  "infraestructura",
  "comunicaciones",
];

/** Cuánto se queda cada palabra en pantalla, y cuánto dura el relevo. */
const PALABRA_MS = 3200;
const SALIDA_MS = 340;

/* Titular cinético (SPEC 110).
   El relevo es un cruce suave, NO un barrido enmascarado: se probó con una
   ventana overflow:hidden y a 68px recortaba la cola de la g de "proteger"
   mientras la palabra subía (el corte se notaba aunque en reposo la letra
   entrara justa). Sin máscara no hay borde que recorte; el recorrido es corto y
   la opacidad hace el trabajo, que además es lo que pidió el cliente: más suave.

   Dos cosas que el cliente veía como "un salto de margen o padding" al cambiar
   de palabra, y que aquí se corrigen:

   1) La caja de .fbx-verbo mide lo que mide la palabra, así que al relevar
      pasaba de golpe de un ancho a otro. Ahora el ancho se mide de antemano
      (ver `useAnchosPalabras`) y se anima: la caja se ensancha o se encoge
      acompañando al relevo en vez de saltar.
   2) La palabra que sale es `position:absolute` y estaba anclada con `left:0`
      SOBRE LA CAJA NUEVA, que ya tenía el ancho de la palabra entrante: al
      arrancar la animación se desplazaba lateralmente decenas de píxeles (el
      "tirón"). Ahora se centra sobre la caja, que es donde estaba, y sólo se
      desvanece hacia arriba.

   El desplazamiento vertical va en la propiedad `translate` — no en
   `transform` — para poder combinarlo con el `translateX(-50%)` que centra la
   palabra saliente sin que uno pise al otro.

   Los tiempos también se solapan más que antes: con el escalonado anterior
   (salida rápida + entrada con 170ms de retardo) había ~150ms en los que no se
   veía NINGUNA palabra y la línea parecía vaciarse. Ahora la que entra arranca
   mientras la que sale todavía se apaga. */
const CSS_TITULAR = `
/* inline-flex + justify-content:center, y no inline-block: la caja anima
   su ancho, y con la palabra en flujo normal quedaba pegada a la IZQUIERDA de
   una caja que todavía tiene el ancho de la palabra anterior. Al entrar una
   palabra más larga ("operar" → "conectar") eso la arrancaba ~20px descentrada
   y la hacía deslizarse hasta su sitio durante los 420ms de la transición: el
   "salto" que el cliente veía en mobile (en desktop los mismos px se diluyen en
   un titular de 900px, por eso allí no se notaba). Centrada, la palabra desborda
   por igual a los dos lados y se queda quieta: sólo respira el ancho. */
.fbx-verbo {
  display: inline-flex;
  justify-content: center;
  align-items: baseline;
  position: relative;
  vertical-align: bottom;
  transition: width 420ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
.fbx-verbo-in,
.fbx-verbo-out {
  display: inline-block;
  /* Sin esto el flex de la caja encogería la palabra cuando el ancho todavía es
     el de la anterior, y el centrado saldría mal justo durante la transición. */
  flex: 0 0 auto;
  /* El degradado se recorta contra el TEXTO, y la caja que se pinta es la del
     padding: sin este aire abajo la cola de la g de "proteger" cae fuera de esa
     caja, se queda sin pintar y se ve cortada (es la única palabra con
     descendente). El margen negativo devuelve el alto, así el titular no crece,
     y las paradas del degradado se recolocan para que el tramo sobre las letras
     se vea igual que antes. */
  padding-bottom: 0.3em;
  margin-bottom: -0.3em;
  background: linear-gradient(180deg, #ffffff 0%, #f7c9ea 43%, #d64db8 78%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.fbx-verbo-out {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
  animation: fbx-verbo-sale 300ms cubic-bezier(0.33, 0, 0.67, 1) forwards;
}
.fbx-verbo-in {
  white-space: nowrap;
  animation: fbx-verbo-entra 460ms cubic-bezier(0.22, 0.61, 0.36, 1) 110ms both;
}
@keyframes fbx-verbo-sale {
  to { translate: 0 -0.18em; opacity: 0; }
}
@keyframes fbx-verbo-entra {
  from { translate: 0 0.18em; opacity: 0; }
  to { translate: 0 0; opacity: 1; }
}
/* Medidor: una copia oculta de cada palabra para conocer su ancho antes de
   mostrarla. Va absoluta y sin visibilidad, así que no ocupa ni se lee. */
.fbx-verbo-medidor {
  position: absolute;
  left: 0;
  top: 0;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
}
.fbx-verbo-medidor > span { display: inline-block; }
@media (prefers-reduced-motion: reduce) {
  .fbx-verbo { transition: none; }
  .fbx-verbo-in { animation: none; }
  .fbx-verbo-out { display: none; }
}
`;

/**
 * Ancho en píxeles de cada palabra del titular, medido sobre una copia oculta.
 *
 * Hace falta para poder ANIMAR el ancho de la caja del verbo: `width: auto` no
 * es interpolable, así que sin un número concreto el relevo sólo puede saltar
 * de un ancho a otro. Se mide después de `document.fonts.ready` porque con la
 * fuente de sistema los anchos salen distintos a los de Poppins, y se revisa
 * con un ResizeObserver: el titular cambia de tamaño por breakpoint, y con él
 * el ancho de cada palabra.
 */
function useAnchosPalabras(palabras: string[]) {
  const medidorRef = useRef<HTMLSpanElement>(null);
  const [anchos, setAnchos] = useState<number[] | null>(null);

  useEffect(() => {
    const el = medidorRef.current;
    if (!el || palabras.length === 0) return;

    const medir = () => {
      const ns = Array.from(el.children).map((c) => (c as HTMLElement).getBoundingClientRect().width);
      setAnchos((prev) =>
        prev && prev.length === ns.length && prev.every((v, i) => Math.abs(v - ns[i]) < 0.5)
          ? prev
          : ns
      );
    };

    medir();
    (document as any).fonts?.ready?.then(medir);

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
    // `palabras` se compara por contenido: es un array nuevo en cada render.
  }, [palabras.join("\u0000")]);

  return { medidorRef, anchos };
}

export default function HeroServiciosReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: HeroServiciosProps) {
  const { data } = useTina<ServiciosQuery>({ query, variables, data: initialData });
  const [webglOk, setWebglOk] = useState(true);
  const raysRef = useRef<CinematicRaysHandle>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const verboRef = useRef<HTMLSpanElement>(null);

  const page = data?.servicios;
  const palabras: string[] = ((page as any)?.headingWords || [])
    .filter(Boolean)
    .map((w: any) => tField(w, "word", locale))
    .filter((w: string) => !!w);

  /* Índice de la palabra visible y de la que está saliendo: durante el relevo
     conviven las dos, una subiendo y la otra entrando desde abajo. */
  const [idx, setIdx] = useState(0);
  const [saliendo, setSaliendo] = useState<number | null>(null);
  const total = palabras.length;
  const { medidorRef, anchos } = useAnchosPalabras(palabras);

  useEffect(() => {
    if (total < 2) return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) return;

    let timer = 0;
    let limpieza = 0;
    const sec = sectionRef.current;

    const relevo = () => {
      setIdx((i) => {
        setSaliendo(i);
        return (i + 1) % total;
      });
      window.clearTimeout(limpieza);
      limpieza = window.setTimeout(() => setSaliendo(null), SALIDA_MS);
      /* La palabra que aterriza empuja una onda de luz en el fondo: el shader y
         el titular laten juntos en vez de ir cada uno por su lado. */
      const box = sec?.getBoundingClientRect();
      const v = verboRef.current?.getBoundingClientRect();
      if (box && v && box.width && box.height) {
        raysRef.current?.pulse(
          (v.left + v.width / 2 - box.left) / box.width,
          (v.top + v.height / 2 - box.top) / box.height
        );
      }
    };

    /* Solo rota mientras el hero está en pantalla: fuera de viewport no hay
       nada que mirar y el intervalo no tiene por qué seguir corriendo. */
    const arranca = () => {
      window.clearInterval(timer);
      timer = window.setInterval(relevo, PALABRA_MS);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) arranca();
        else window.clearInterval(timer);
      },
      { threshold: 0 }
    );
    if (sec) io.observe(sec);
    arranca();

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(limpieza);
      io.disconnect();
    };
  }, [total]);

  if (!page) return null;

  /* Inicio del breadcrumb: en EN apunta al home en inglés, no al de ES. */
  const homeHref = localizedPath("/", locale);
  const eyebrow = tField(page as any, "eyebrow", locale);
  const prefijo = tField(page as any, "headingPrefix", locale);
  const sufijo = tField(page as any, "headingSuffix", locale);
  /* Sin palabras configuradas, el titular es el de siempre (campo `heading`). */
  const cinetico = total > 0;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS_TITULAR }} />

      {/* Fondo cinematic: god-rays + iconos de categoría flotando + polvo de luz
          (recuperado del hero home pre-planeta). Fallback a un plexus ligero si
          WebGL no está disponible. */}
      <div className="absolute inset-0 z-0">
        {webglOk ? (
          <CinematicRays
            ref={raysRef}
            className="h-full w-full"
            iconKeys={ICON_KEYS}
            signalReady
            onUnsupported={() => setWebglOk(false)}
          />
        ) : (
          <NodeField className="h-full w-full" signalReady lines />
        )}
      </div>

      {/* Velo sutil para legibilidad del titular sobre el fondo animado. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 46%, rgba(10,10,10,0.66) 0%, rgba(10,10,10,0) 72%)",
        }}
      />

      <div className="relative z-10 w-full site-container py-16 text-center sm:py-20 md:py-24">
        <div
          className="mx-auto max-w-[900px]"
          data-reveal="up"
          data-reveal-stagger="0.12"
        >
          {/* Breadcrumb (mismo tamaño que Nosotros: text-sm) */}
          <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
            <ol className="flex items-center justify-center gap-2 text-sm">
              <li>
                <a
                  href={homeHref}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  {t("breadcrumb.home", locale)}
                </a>
              </li>
              <li className="text-white/30">/</li>
              <li
                className="text-white font-medium"
                data-tina-field={tinaField(page, "breadcrumb")}
              >
                {tField(page as any, "breadcrumb", locale)}
              </li>
            </ol>
          </nav>

          {eyebrow && (
            <p
              className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#d64db8] sm:mb-4 sm:tracking-[0.22em] md:text-[12px] md:tracking-[0.28em]"
              data-tina-field={tinaField(page, "eyebrow")}
            >
              {eyebrow}
            </p>
          )}

          <h1
            className="mx-auto mb-5 max-w-[17ch] text-[34px] font-medium leading-[1.08] text-greyscale-white sm:mb-6 sm:text-[46px] md:text-[58px] lg:text-[68px]"
            style={{ textShadow: "0 0 28px rgba(150,35,122,0.5)" }}
            data-tina-field={tinaField(page, cinetico ? "headingWords" : "heading")}
          >
            {cinetico ? (
              <>
                {prefijo && <span className="block">{prefijo}</span>}
                {/* El verbo va en su propia línea: al cambiar de ancho no
                    arrastra al resto del titular. */}
                <span className="block">
                  <span
                    className="fbx-verbo"
                    ref={verboRef}
                    /* Sin medición todavía (SSR, primer pintado) la caja se
                       ajusta sola al texto: el ancho explícito sólo entra
                       cuando ya se puede animar hacia el siguiente. */
                    style={anchos?.[idx] ? { width: anchos[idx] } : undefined}
                  >
                    {saliendo !== null && saliendo !== idx && (
                      <span className="fbx-verbo-out" aria-hidden="true">
                        {palabras[saliendo]}
                      </span>
                    )}
                    <span className="fbx-verbo-in" key={idx}>
                      {palabras[idx]}
                    </span>
                  </span>
                  <span className="fbx-verbo-medidor" ref={medidorRef} aria-hidden="true">
                    {palabras.map((p, i) => (
                      <span key={i}>{p}</span>
                    ))}
                  </span>
                </span>
                {sufijo && <span className="block">{sufijo}</span>}
              </>
            ) : (
              tField(page as any, "heading", locale)
            )}
          </h1>

          <p
            className="mx-auto mb-7 max-w-[54ch] text-body-lg text-greyscale-light sm:mb-8"
            data-tina-field={tinaField(page, "intro")}
          >
            {tField(page as any, "intro", locale)}
          </p>

          {page.ctaLabel && (
            <a
              href="#soluciones-stack"
              className={buttonClass("primary")}
              data-tina-field={tinaField(page, "ctaLabel")}
            >
              {tField(page as any, "ctaLabel", locale)}
            </a>
          )}
        </div>
      </div>

      {/* Empalme con el negro del bloque siguiente (antes había un corte seco) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-b from-transparent to-[#0a0a0a]"
      />
    </section>
  );
}
