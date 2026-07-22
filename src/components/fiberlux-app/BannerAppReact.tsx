import { useTina, tinaField } from "tinacms/dist/react";
import type { FiberluxAppQuery } from "../../../tina/__generated__/types";
import { FaAndroid, FaApple, FaCheck } from "react-icons/fa6";
import { mediaUrl } from "../../utils/mediaUrl";

interface BannerAppProps {
  query: string;
  variables: { relativePath: string };
  data: FiberluxAppQuery;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const asset = (p: string) => `${BASE}${p}`;
const LOGO = asset("/images/logo/fiberlux.svg");
const APP_ICON = asset("/fiberlux-favicon.png");
const MOCKUP_FALLBACK = asset("/images/fiberlux-app/mockup.png");

/* Contorno "sim-container" (muesca abajo-izquierda) — rutas de los SVG del
   proyecto, renderizadas como contorno estirable (no recorta el fondo). */
const FRAME_D =
  "M957 199C957 208.941 948.941 217 939 217H75.3419C69.8631 217 64.6826 214.505 61.2672 210.221L3.92534 138.294C1.38396 135.106 0 131.15 0 127.073V18C0 8.05888 8.05887 0 18 0H939C948.941 0 957 8.05888 957 18V199Z";
const FRAME_M =
  "M613 465C613 474.941 604.941 483 595 483H57.0449C48.6546 483 41.377 477.203 39.5008 469.025L0.455827 298.843C0.15291 297.523 0 296.173 0 294.818V18C0 8.05888 8.05888 0 18 0H595C604.941 0 613 8.05888 613 18V465Z";

function FrameOutline({ path, viewBox }: { path: string; viewBox: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={viewBox}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path d={path} stroke="rgba(255,255,255,0.38)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* Resalta "Fiberlux App" en el texto de descarga. */
function renderDownloadText(text: string) {
  const parts = text.split(/(Fiberlux App)/i);
  return parts.map((p, i) =>
    /^Fiberlux App$/i.test(p) ? (
      <strong key={i} className="font-semibold text-greyscale-darkest">
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export default function BannerAppReact({ query, variables, data: initialData }: BannerAppProps) {
  const { data } = useTina<FiberluxAppQuery>({ query, variables, data: initialData });

  const b = (data?.fiberluxApp as any)?.banner || (initialData?.fiberluxApp as any)?.banner;
  const tinaB = (data?.fiberluxApp as any)?.banner;
  if (!b) return null;

  const bullets = (b.bullets || []).filter(Boolean) as { title?: string; text?: string }[];
  const mockup = mediaUrl(b.mockup) || MOCKUP_FALLBACK;
  const androidUrl: string = b.androidUrl || "";
  const iosUrl: string = b.iosUrl || "";
  const downloadText: string = b.downloadText || "";

  // Fondo del panel: negro a la izquierda → magenta a la derecha + patrón geométrico sutil.
  const panelBg: React.CSSProperties = {
    background:
      "linear-gradient(100deg, #0a0a0a 0%, #0a0a0a 22%, #3B0E30 46%, #7a1c63 72%, #96237A 100%)",
  };
  const patternBg: React.CSSProperties = {
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.5'%3E%3Cpath d='M0 90 60 30 120 90M60 30 60 120M0 30 60 90 120 30'/%3E%3C/g%3E%3C/svg%3E\")",
    backgroundSize: "160px 160px",
    opacity: 0.12,
  };

  /* ── Badge Android | iOS ── */
  const storeBadge = (
    <div className="inline-flex items-center gap-2 rounded-full bg-greyscale-darkest/90 px-3.5 py-1.5 text-[13px] font-medium text-white">
      <a
        href={androidUrl || undefined}
        target={androidUrl ? "_blank" : undefined}
        rel={androidUrl ? "noopener noreferrer" : undefined}
        className={`inline-flex items-center gap-1.5 ${androidUrl ? "hover:text-white/80" : "cursor-default"}`}
      >
        Android <FaAndroid className="text-[15px]" />
      </a>
      <span className="text-white/30">|</span>
      <a
        href={iosUrl || undefined}
        target={iosUrl ? "_blank" : undefined}
        rel={iosUrl ? "noopener noreferrer" : undefined}
        className={`inline-flex items-center gap-1.5 ${iosUrl ? "hover:text-white/80" : "cursor-default"}`}
      >
        iOS <FaApple className="text-[15px]" />
      </a>
    </div>
  );

  /* ── Pill blanca "Búscanos como Fiberlux App…" ── */
  const downloadPill = (
    <a
      href={iosUrl || androidUrl || asset("/fiberlux-app")}
      target={iosUrl || androidUrl ? "_blank" : undefined}
      rel={iosUrl || androidUrl ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg transition-transform hover:scale-[1.02]"
      data-tina-field={tinaB ? tinaField(tinaB, "downloadText") : undefined}
    >
      <img src={APP_ICON} alt="Fiberlux App" className="h-10 w-10 rounded-[10px] shrink-0" draggable={false} />
      <span className="text-[14px] leading-[1.25] text-greyscale-darkest max-w-[190px]">
        {renderDownloadText(downloadText)}
      </span>
    </a>
  );

  /* ── Bloque de texto (titular + pill + logo) ── */
  const textBlock = (
    <div>
      <h2 className="text-[30px] md:text-[40px] leading-[1.08] text-white max-w-[13ch]">
        <span data-tina-field={tinaB ? tinaField(tinaB, "headingLead") : undefined}>
          {b.headingLead}
        </span>{" "}
        <strong className="font-bold" data-tina-field={tinaB ? tinaField(tinaB, "headingStrong") : undefined}>
          {b.headingStrong}
        </strong>
      </h2>
      <div className="mt-5 inline-block rounded-lg bg-brand-purple px-4 py-2">
        <span
          className="text-[15px] md:text-[16px] text-white"
          data-tina-field={tinaB ? tinaField(tinaB, "pillText") : undefined}
        >
          {b.pillText}
        </span>
      </div>
      <img src={LOGO} alt="Fiberlux" className="mt-4 h-7 md:h-8 w-auto" draggable={false} />
    </div>
  );

  /* ── Lista de bullets ── */
  const bulletList = (
    <ul className="flex flex-col gap-5">
      {bullets.map((bt, i) => {
        const tinaItem = tinaB?.bullets?.[i];
        return (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-purple">
              <FaCheck className="text-[12px]" />
            </span>
            <p className="text-[15px] md:text-[16px] leading-[1.35] text-white">
              <strong
                className="font-bold text-white"
                data-tina-field={tinaItem ? tinaField(tinaItem, "title") : undefined}
              >
                {bt.title}
              </strong>{" "}
              <span data-tina-field={tinaItem ? tinaField(tinaItem, "text") : undefined}>{bt.text}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="bg-greyscale-darkest py-10 md:py-14 overflow-hidden">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-[16px]" style={panelBg}>
          {/* Patrón geométrico sutil */}
          <div className="pointer-events-none absolute inset-0 z-0" style={patternBg} aria-hidden="true" />

          {/* Teléfono a sangre desde la derecha (desktop): más grande, la diagonal
              del PNG se recorta fuera del panel para que entre limpio. */}
          <img
            src={mockup}
            alt="Fiberlux App"
            className="pointer-events-none absolute z-0 right-[-3%] top-[-14%] h-[132%] w-auto max-w-none select-none hidden md:block"
            draggable={false}
          />

          {/* ════ DESKTOP ════ */}
          <div className="relative z-10 hidden md:block px-8 lg:px-10 py-10">
            <div className="w-[64%]">
              {/* Marco notched (contorno SVG) con texto + bullets */}
              <div className="relative pl-9 pr-6 pt-8 pb-12">
                <FrameOutline path={FRAME_D} viewBox="0 0 957 217" />
                <div className="relative grid grid-cols-[0.82fr_1.18fr] items-center gap-8">
                  <div>{textBlock}</div>
                  <div>{bulletList}</div>
                </div>
              </div>
            </div>
            {/* Badge + pill de descarga, sobre el teléfono */}
            <div className="absolute right-[23%] top-1/2 -translate-y-1/2 z-30 flex flex-col items-start gap-2">
              {storeBadge}
              {downloadPill}
            </div>
          </div>

          {/* ════ MOBILE ════ */}
          <div className="relative z-10 flex md:hidden flex-col px-6 pt-10 pb-0">
            <div className="relative px-6 pt-7 pb-10">
              <FrameOutline path={FRAME_M} viewBox="0 0 613 483" />
              <div className="relative">{textBlock}</div>
            </div>
            <div className="mt-8">{bulletList}</div>
            <div className="mt-8 flex flex-col items-start gap-2">
              {storeBadge}
              {downloadPill}
            </div>
            <img
              src={mockup}
              alt="Fiberlux App"
              className="pointer-events-none mt-6 -mb-1 w-[95%] max-w-none self-end select-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
