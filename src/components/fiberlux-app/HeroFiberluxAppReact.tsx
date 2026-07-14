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
  const mockupSrc = hero?.mockup
    ? `${base}${hero.mockup}`.replace(/([^:])\/\//g, "$1/")
    : "";

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Magenta gradient backdrop image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${base}images/services/hero-img.png)`,
          backgroundPosition: "75% center",
        }}
        aria-hidden="true"
      />
      {/* Dark overlay so the left-column copy stays legible */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.72) 34%, rgba(10,10,10,0.15) 62%, rgba(10,10,10,0) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 site-container pt-28 pb-20 lg:pt-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ════ LEFT — content ════ */}
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
              <div className="flex flex-wrap gap-4">
                {downloads.map((d, i) => {
                  const Icon =
                    (d.store && STORE_ICONS[d.store]) || FaMobileScreenButton;
                  return (
                    <a
                      key={i}
                      href={d.url || "#"}
                      className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full font-medium text-base transition-all duration-300 bg-[#96237A] hover:bg-[#650F50] text-white shadow-[0_8px_32px_-8px_rgba(150,35,122,0.6)] hover:shadow-[0_8px_32px_-4px_rgba(150,35,122,0.8)] hover:translate-y-[-1px]"
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

          {/* ════ RIGHT — app mockup ════ */}
          <div className="flex justify-center lg:justify-end">
            {mockupSrc ? (
              <img
                src={mockupSrc}
                alt={hero?.heading || "Fiberlux App"}
                className="w-auto max-h-[560px] object-contain drop-shadow-[0_24px_60px_rgba(150,35,122,0.4)]"
                data-tina-field={tinaField(hero, "mockup")}
              />
            ) : (
              <div
                className="flex items-center justify-center w-[260px] h-[520px] rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-sm text-greyscale"
                data-tina-field={tinaField(hero, "mockup")}
                aria-hidden="true"
              >
                <FaMobileScreenButton size={72} className="opacity-40" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
