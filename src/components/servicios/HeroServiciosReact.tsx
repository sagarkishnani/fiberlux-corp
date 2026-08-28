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
   El relevo va ESCALONADO (la que entra arranca con retardo, ya casi apagada la
   que sale): si se cruzan a media opacidad se leen las dos encimadas. */
const CSS_TITULAR = `
.fbx-verbo {
  display: inline-block;
  position: relative;
  vertical-align: bottom;
}
.fbx-verbo-in,
.fbx-verbo-out {
  display: inline-block;
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
  left: 0;
  top: 0;
  white-space: nowrap;
  animation: fbx-verbo-sale 300ms cubic-bezier(0.4, 0, 0.8, 0.3) forwards;
}
.fbx-verbo-in {
  animation: fbx-verbo-entra 580ms cubic-bezier(0.22, 0.61, 0.36, 1) 170ms both;
}
@keyframes fbx-verbo-sale {
  to { transform: translateY(-0.18em); opacity: 0; }
}
@keyframes fbx-verbo-entra {
  from { transform: translateY(0.18em); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .fbx-verbo-in { animation: none; }
  .fbx-verbo-out { display: none; }
}
`;

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
                  <span className="fbx-verbo" ref={verboRef}>
                    {saliendo !== null && saliendo !== idx && (
                      <span className="fbx-verbo-out" aria-hidden="true">
                        {palabras[saliendo]}
                      </span>
                    )}
                    <span className="fbx-verbo-in" key={idx}>
                      {palabras[idx]}
                    </span>
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
