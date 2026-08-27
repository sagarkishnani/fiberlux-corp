import { useEffect, useMemo, useRef, useState } from "react";
import { buttonClass } from "../shared/Button";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { Components } from "tinacms/dist/rich-text";
import { FaPlay, FaArrowUp } from "react-icons/fa6";
import type {
  FiberluxAppQuery,
  FiberluxAppQueryVariables,
} from "../../../tina/__generated__/types";
import { tField, richField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import type { Locale } from "../../i18n/config";
// Se reutiliza el MISMO modal de video de Casos de éxito (SPEC 13). Solo lee
// `youtubeUrl`/`videoFile`, así que le pasamos una fuente mínima con la URL.
import VideoModal from "../casos-de-exito/VideoModal";
import type { Caso } from "../casos-de-exito/CasoCard";

interface VideoShowcaseAppProps {
  query: string;
  variables: FiberluxAppQueryVariables;
  data: FiberluxAppQuery;
  locale?: Locale;
}

/** True cuando el nodo rich-text tiene algún texto no vacío. */
function hasContent(node: any): boolean {
  const children = node?.children;
  if (!Array.isArray(children)) return false;
  const collect = (nodes: any[]): string =>
    nodes
      .map((n) =>
        typeof n?.text === "string"
          ? n.text
          : Array.isArray(n?.children)
          ? collect(n.children)
          : ""
      )
      .join("");
  return collect(children).trim().length > 0;
}

/* ── Ajustes de las animaciones (SPEC: hover magnet + máquina de escribir) ──
   Deliberadamente cortos: el cliente pidió "sutil". Subir MAGNET_SHIFT/TILT
   hace el imán más agresivo; TYPE_MS es el intervalo entre caracteres. */
const MAGNET_SHIFT = 10; // px de desplazamiento máximo hacia el cursor
const MAGNET_TILT = 4; // grados de inclinación 3D máxima
const TYPE_MS = 42; // ms entre carácter y carácter

/** ¿El navegador tiene puntero fino y el usuario no pidió menos movimiento? */
function prefersMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** La negrita del párrafo (p.ej. "Fiberlux App") conserva el color, solo bold. */
const bodyComponents: Components<{}> = {
  bold: (props: any) => <strong className="font-semibold">{props.children}</strong>,
};

export default function VideoShowcaseAppReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: VideoShowcaseAppProps) {
  const { data } = useTina<FiberluxAppQuery>({
    query,
    variables,
    data: initialData,
  });
  const [open, setOpen] = useState(false);

  const vs = data?.fiberluxApp?.videoShowcase;

  const heading = vs ? tField(vs as any, "heading", locale) : "";

  /* ── Título "máquina de escribir" ──
     Cada carácter ya está en el DOM desde el primer paint; lo que se anima es
     su opacidad. Eso hace dos cosas: la caja nunca cambia (el texto no
     reflowea ni salta de línea al crecer una palabra a fin de renglón, que era
     lo que se sentía tosco) y el fundido de cada letra dura bastante más que
     el intervalo entre letras, así que en todo momento hay una decena de
     caracteres a medio aparecer — se lee como una ola y no como un salto.

     `animate` arranca en false para que el HTML servido (la isla monta con
     client:visible) traiga el título completo y legible: si el JS falla o
     tarda, el texto se lee igual. */
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const [animate, setAnimate] = useState(false);
  const [armed, setArmed] = useState(false);

  const chars = useMemo(() => Array.from(heading), [heading]);

  useEffect(() => {
    const el = headingRef.current;
    if (!el || !heading || !prefersMotion()) return;

    /* Si al hidratar el título YA está en pantalla, no animamos: apagar un
       texto que el usuario acaba de leer se ve como un parpadeo. */
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;

    setAnimate(true);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setArmed(true);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [heading]);

  useEffect(() => {
    if (!armed || !animate) return;
    const el = headingRef.current;
    const host = textRef.current;
    if (!el || !host) return;

    const spans = Array.from(host.children) as HTMLElement[];
    const caret = caretRef.current;

    /* El cursor va posicionado en absoluto (no intercalado entre letras): así
       no ocupa espacio y no empuja el texto al avanzar.

       Se centra contra la caja de la LETRA, no contra la de la línea: con
       line-height 1.08 sobre 52px la caja de línea es más alta que los glifos,
       y anclarlo arriba dejaba el cursor flotando por encima del texto. */
    const placeCaret = (i: number) => {
      const s = spans[i];
      if (!caret || !s) return;
      const hr = el.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      caret.style.left = `${sr.right - hr.left}px`;
      caret.style.top = `${sr.top - hr.top + (sr.height - caret.offsetHeight) / 2}px`;
    };

    let raf = 0;
    let startedAt = 0;
    let shown = 0;

    /* rAF en vez de setInterval: la cadencia queda alineada al frame, sin el
       jitter de un timer que cae entre repintados. */
    const step = (t: number) => {
      if (!startedAt) startedAt = t;
      const n = Math.min(spans.length, Math.floor((t - startedAt) / TYPE_MS) + 1);
      if (n > shown) {
        for (let i = shown; i < n; i++) spans[i].classList.add("is-in");
        placeCaret(n - 1);
        shown = n;
      }
      if (shown < spans.length) {
        raf = requestAnimationFrame(step);
      } else {
        /* Al terminar el cursor se va: quedarse parpadeando junto a la última
           letra ensucia el remate del título. Se apaga con el mismo fundido
           que el último carácter, así que no hay un corte seco. */
        caret?.classList.add("is-out");
      }
    };
    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [armed, animate, chars.length]);

  /* ── Hover "magnet" del dispositivo ──
     El bloque se desplaza e inclina hacia el cursor y vuelve al soltarlo. Solo
     con puntero fino (en táctil no hay hover) y respetando reduced-motion. El
     transform se escribe directo al DOM dentro de un rAF: con estado de React
     serían decenas de renders por segundo. */
  const deviceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = deviceRef.current;
    if (!el || !prefersMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let rx = 0;
    let ry = 0;

    const apply = () => {
      raf = 0;
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); // -1..1
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tx = nx * MAGNET_SHIFT;
      ty = ny * MAGNET_SHIFT;
      ry = nx * MAGNET_TILT;
      rx = -ny * MAGNET_TILT;
      schedule();
    };
    const onLeave = () => {
      tx = ty = rx = ry = 0;
      schedule();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, []);

  if (!vs) return null;

  const buttonLabel = tField(vs as any, "buttonLabel", locale) || "Ver video";
  const body = richField(vs as any, "body", locale);
  const showBody = hasContent(body);

  const videoUrl = vs.videoUrl?.trim() || "";
  const desktopSrc = mediaUrl(vs.imageDesktop);
  const mobileSrc = mediaUrl(vs.imageMobile || vs.imageDesktop);
  const hasImage = Boolean(vs.imageDesktop || vs.imageMobile);

  const openVideo = () => {
    if (videoUrl) setOpen(true);
  };

  return (
    <section className="bg-greyscale-white rounded-t-[2rem] pt-16 pb-32 md:pt-24 md:pb-40">
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ── Izquierda: texto ── */}
          <div className="order-1">
            {heading && (
              <h2
                ref={headingRef}
                aria-label={heading}
                className={`relative text-[34px] md:text-[52px] leading-[1.08] font-medium text-[#96237A] mb-6${
                  animate ? " vs-typing" : ""
                }`}
                data-tina-field={tinaField(vs, "heading")}
              >
                {/* `aria-label` arriba da el texto entero a los lectores de
                    pantalla; esta ristra de <span> por carácter es solo visual
                    y no debe leerse letra a letra. */}
                <span aria-hidden="true" ref={textRef}>
                  {chars.map((c, i) => (
                    <span key={i} className="vs-ch">
                      {c}
                    </span>
                  ))}
                </span>
                {animate && <span ref={caretRef} aria-hidden="true" className="vs-caret" />}
              </h2>
            )}
            {showBody && (
              <div
                className="text-body-lg text-brand-purple-darkest/70 max-w-[440px]"
                data-tina-field={tinaField(vs, "body")}
              >
                <TinaMarkdown content={body} components={bodyComponents} />
              </div>
            )}
          </div>

          {/* ── Derecha: laptop + play ── */}
          {/* `perspective` en el padre para que la inclinación del imán se lea
              como 3D. El glow queda FUERA del wrapper que se mueve: es la
              sombra sobre el suelo, no debe viajar con el dispositivo. */}
          <div className="order-2 relative" style={{ perspective: 900 }}>
            {/* Glow/sombra difusa bajo el dispositivo (efecto flotante) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[1%] w-[82%] h-[44%] z-0 blur-2xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(150,35,122,0.22) 0%, rgba(150,35,122,0.09) 42%, transparent 72%)",
              }}
            />
            <div ref={deviceRef} className="vs-magnet relative">
            {hasImage && (
              <>
                <img
                  src={desktopSrc}
                  alt=""
                  aria-hidden="true"
                  className="hidden lg:block relative z-10 w-full h-auto"
                  data-tina-field={tinaField(vs, "imageDesktop")}
                />
                <img
                  src={mobileSrc}
                  alt=""
                  aria-hidden="true"
                  className="lg:hidden relative z-10 w-full h-auto"
                  data-tina-field={tinaField(vs, "imageMobile")}
                />
              </>
            )}

            {videoUrl && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <button
                  type="button"
                  onClick={openVideo}
                  aria-label="Reproducir video"
                  className="-translate-y-[8%] flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-purple-darkest/70 hover:bg-brand-purple-darkest/90 backdrop-blur-sm border border-white/20 text-white shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <FaPlay size={22} className="ml-1" />
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* ── Botón "Ver video" ── */}
        {videoUrl && (
          <div className="mt-10 md:mt-12 flex justify-center">
            <button
              type="button"
              onClick={openVideo}
              className={buttonClass("primary", "gap-2")}
              data-tina-field={tinaField(vs, "buttonLabel")}
            >
              {buttonLabel}
              <FaArrowUp size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        /* El imán: el transform lo escribe el efecto, la transición hace el
           amortiguado (tanto al seguir el cursor como al volver a su sitio). */
        .vs-magnet {
          transition: transform .45s cubic-bezier(.22, .61, .36, 1);
          will-change: transform;
          transform-style: preserve-3d;
        }
        /* Máquina de escribir: cada letra funde en ~9 veces lo que tarda la
           siguiente en entrar, así que siempre hay una ola de caracteres a
           medio aparecer en vez de letras que aparecen de golpe. Sin la clase
           .vs-typing (SSR, JS caído o reduced-motion) el texto es opaco. */
        .vs-typing .vs-ch {
          opacity: 0;
          transition: opacity .3s ease-out;
        }
        .vs-typing .vs-ch.is-in { opacity: 1; }

        /* Cursor: posicionado en absoluto sobre el h2, sin ocupar espacio. */
        .vs-caret {
          position: absolute;
          left: 0;
          top: 0;
          width: 3px;
          height: .78em;
          background: currentColor;
          animation: vsBlink .9s steps(1, end) infinite;
          transition: opacity .3s ease;
        }
        /* Cortar la animación es imprescindible: mientras el parpadeo corre,
           sus keyframes pisan cualquier opacity declarada y el cursor no se
           apagaría nunca. Al cortarlo, la transición sí puede fundirlo. */
        .vs-caret.is-out { animation: none; opacity: 0; }
        @keyframes vsBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

        @media (prefers-reduced-motion: reduce) {
          .vs-magnet { transition: none; }
          .vs-caret { animation: none; }
          .vs-typing .vs-ch { opacity: 1; transition: none; }
        }
      `}</style>

      {/* Modal de video (mismo que Casos de éxito) */}
      <VideoModal
        caso={open && videoUrl ? ({ youtubeUrl: videoUrl } as Caso) : null}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
