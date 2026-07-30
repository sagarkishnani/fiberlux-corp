import { useState } from "react";
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
  if (!vs) return null;

  const heading = tField(vs as any, "heading", locale);
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
    <section className="bg-greyscale-white rounded-t-[2rem] py-16 md:py-24">
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ── Izquierda: texto ── */}
          <div className="order-1">
            {heading && (
              <h2
                className="text-[34px] md:text-[52px] leading-[1.08] font-medium text-[#96237A] mb-6"
                data-tina-field={tinaField(vs, "heading")}
              >
                {heading}
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
          <div className="order-2 relative">
            {/* Glow/sombra difusa bajo el dispositivo (efecto flotante) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[1%] w-[82%] h-[44%] z-0 blur-2xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(150,35,122,0.22) 0%, rgba(150,35,122,0.09) 42%, transparent 72%)",
              }}
            />
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

        {/* ── Botón "Ver video" ── */}
        {videoUrl && (
          <div className="mt-10 md:mt-12 flex justify-center">
            <button
              type="button"
              onClick={openVideo}
              className="inline-flex items-center gap-2 rounded-full bg-[#96237A] hover:bg-[#650F50] text-white font-medium px-8 py-3.5 transition-all duration-300 hover:translate-y-[-1px] shadow-[0_8px_32px_-8px_rgba(150,35,122,0.5)]"
              data-tina-field={tinaField(vs, "buttonLabel")}
            >
              {buttonLabel}
              <FaArrowUp size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal de video (mismo que Casos de éxito) */}
      <VideoModal
        caso={open && videoUrl ? ({ youtubeUrl: videoUrl } as Caso) : null}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
