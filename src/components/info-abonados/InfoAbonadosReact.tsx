import { useTina, tinaField } from "tinacms/dist/react";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import PageHero from "../shared/fx/PageHero";

interface InfoAbonadosProps {
  query: string;
  variables: { relativePath: string };
  data: any;
  locale?: Locale;
}

/* ── Icon components ── */
const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ScaleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18" /><path d="M3 7h18" />
    <path d="M6 7l-3 9h6L6 7Z" /><path d="M18 7l-3 9h6l-3-9Z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
  </svg>
);

const CertificateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const iconMap: Record<string, React.FC> = {
  document: DocumentIcon,
  shield: ShieldIcon,
  scale: ScaleIcon,
  clipboard: ClipboardIcon,
  folder: FolderIcon,
  certificate: CertificateIcon,
};

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

export default function InfoAbonadosReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: InfoAbonadosProps) {
  const { data } = useTina({ query, variables, data: initialData });
  const page = data?.infoAbonados || initialData?.infoAbonados;
  if (!page) return null;

  const sections = (page.sections || []).filter((s: any) => s && s.visible !== false);
  const cleanBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  return (
    <>
      <PageHero
        crumb={tField(page, "title", locale)}
        title={tField(page, "title", locale)}
        subtitle={tField(page, "description", locale)}
        titleTinaField={tinaField(page, "title")}
        subtitleTinaField={tinaField(page, "description")}
        locale={locale}
        variant="soft"
      />
      <div className="fx-container pb-[67px] lg:pb-40">
        {sections.map((section: any, i: number) => {
          const docs = (section.documents || []).filter((d: any) => d && d.visible !== false);
          return (
            <section key={i} className="mt-[50px] lg:mt-20">
              {section.title && (
                <h2
                  data-reveal="up"
                  {...REVEAL}
                  className="m-0 text-[28px] font-medium leading-[1.1] tracking-[-.025em] text-fx-ink lg:text-[40px]"
                  data-tina-field={tinaField(section, "title")}
                >
                  {tField(section, "title", locale)}
                </h2>
              )}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-8 lg:grid-cols-4 lg:gap-5">
                {docs.map((doc: any, j: number) => {
                  const IconComp = iconMap[doc.icon || "document"] || DocumentIcon;
                  const rawUrl: string = doc.url || "";
                  const hasUrl = rawUrl && rawUrl !== "#";
                  /* Externo (http) o PDF → nueva pestaña. Interno → misma pestaña y BASE_URL-aware. */
                  const isExternal = /^https?:\/\//i.test(rawUrl);
                  const isPdf = /\.pdf(?:$|[?#])/i.test(rawUrl);
                  const newTab = isExternal || isPdf;
                  const href = isExternal ? rawUrl : rawUrl.startsWith("/") ? cleanBase + rawUrl : rawUrl;
                  const Tag = hasUrl ? "a" : "div";
                  return (
                    <Tag
                      key={j}
                      {...(hasUrl ? { href } : {})}
                      {...(hasUrl && newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      data-reveal="up"
                      {...REVEAL}
                      data-reveal-delay={String((j % 4) * 0.06)}
                      className={`group/doc flex min-h-[170px] flex-col justify-between gap-6 rounded-[24px] border border-fx-line bg-white p-5 text-fx-ink lg:min-h-[200px] lg:p-7 ${
                        hasUrl
                          ? "transition-[transform,border-color,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:border-fx-lilac-strong hover:text-fx-ink hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.4)]"
                          : ""
                      }`}
                      data-tina-field={tinaField(doc, "title")}
                    >
                      <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#FAF0F6] text-fx-purple transition-colors duration-[400ms] group-hover/doc:bg-fx-purple group-hover/doc:text-white">
                        <IconComp />
                      </span>
                      <span className="text-[14px] font-medium leading-[1.4] text-fx-ink lg:text-[16px]">{tField(doc, "title", locale)}</span>
                    </Tag>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
