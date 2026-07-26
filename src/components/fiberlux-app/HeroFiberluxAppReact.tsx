import { useTina, tinaField } from "tinacms/dist/react";
import { FaApple, FaGooglePlay, FaMobileScreenButton } from "react-icons/fa6";
import type {
  FiberluxAppQuery,
  FiberluxAppQueryVariables,
} from "../../../tina/__generated__/types";

interface HeroFiberluxAppProps {
  query: string;
  variables: FiberluxAppQueryVariables;
  data: FiberluxAppQuery;
}

interface Download {
  store?: string | null;
  label?: string | null;
  url?: string | null;
}

const STORE_ICONS: Record<string, typeof FaApple> = {
  appstore: FaApple,
  googleplay: FaGooglePlay,
};

export default function HeroFiberluxAppReact({
  query,
  variables,
  data: initialData,
}: HeroFiberluxAppProps) {
  const { data } = useTina<FiberluxAppQuery>({
    query,
    variables,
    data: initialData,
  });

  const app = data?.fiberluxApp;
  if (!app) return null;

  const hero = app.hero;
  const base = import.meta.env.BASE_URL || "/";
  const downloads = (hero?.downloads || []).filter(Boolean) as Download[];
  const img = (name: string) => `${base}images/fiberlux-app/${name}`;

  return (
    <section
      className="relative overflow-hidden -mt-16 min-h-[560px] lg:min-h-[620px]"
      style={{ background: "#0a0a0a" }}
    >
      {/* ── Fondo responsive a sangre (mobile ≤600 / tablet ≤1024 / desktop) ── */}
      <picture>
        <source media="(min-width: 1025px)" srcSet={img("banner-app.png")} />
        <source media="(min-width: 601px)" srcSet={img("banner-app-600.png")} />
        <img
          src={img("banner-app-300.png")}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 z-0 h-full w-full object-cover object-center lg:object-right"
        />
      </picture>

      {/* Degradé de contraste a la izquierda (desktop), como el hero de solución */}
      <div
        className="hidden lg:block absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.85) 30%, rgba(10,10,10,0.35) 56%, rgba(10,10,10,0) 82%)",
        }}
        aria-hidden="true"
      />
      {/* Degradé vertical (mobile / tablet) */}
      <div
        className="lg:hidden absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.35) 34%, rgba(10,10,10,0.85) 74%, #0a0a0a 100%)",
        }}
        aria-hidden="true"
      />
      {/* Fade inferior (desktop) para fundir con la sección de abajo */}
      <div
        className="hidden lg:block absolute inset-x-0 bottom-0 z-0 h-48"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0) 0%, #0a0a0a 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 site-container pt-28 pb-20 lg:pt-36 lg:pb-16">
        {/* ════ Copy a la izquierda (una sola columna; la foto ya trae el teléfono) ════ */}
        <div className="max-w-[560px]">
          {hero?.heading && (
            <h1
              className="text-[32px] md:text-[48px] leading-[1.12] font-semibold text-greyscale-white mb-6"
              data-tina-field={tinaField(hero, "heading")}
            >
              {hero.heading}
            </h1>
          )}

          {hero?.description && (
            <p
              className="text-body-lg text-greyscale-light max-w-[480px] mb-6"
              data-tina-field={tinaField(hero, "description")}
            >
              {hero.description}
            </p>
          )}

          {hero?.note && (
            <div
              className="max-w-[520px] mb-8 rounded-xl border-l-2 border-[#96237A] bg-white/[0.05] px-5 py-4"
              data-tina-field={tinaField(hero, "note")}
            >
              <p className="text-body-sm text-greyscale-light">{hero.note}</p>
            </div>
          )}

          {downloads.length > 0 && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
              {downloads.map((d, i) => {
                const Icon =
                  (d.store && STORE_ICONS[d.store]) || FaMobileScreenButton;
                const isPrimary = i === 0;
                const variantClasses = isPrimary
                  ? "bg-[#96237A] hover:bg-[#650F50] text-white shadow-[0_8px_32px_-8px_rgba(150,35,122,0.6)] hover:shadow-[0_8px_32px_-4px_rgba(150,35,122,0.8)] hover:translate-y-[-1px]"
                  : "border border-white/80 hover:border-white bg-transparent hover:bg-white/5 text-white backdrop-blur-sm";
                return (
                  <a
                    key={i}
                    href={d.url || "#"}
                    target={d.url && d.url !== "#" ? "_blank" : undefined}
                    rel={d.url && d.url !== "#" ? "noopener noreferrer" : undefined}
                    className={`inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full font-medium text-base transition-all duration-300 ${variantClasses}`}
                    data-tina-field={tinaField(d as any, "label")}
                  >
                    <Icon size={22} />
                    {d.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
