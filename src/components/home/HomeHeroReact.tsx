import { useRef } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { localizeHref, tField } from "../../utils/i18n";
import { PillLink, fxAsset } from "../shared/fx/FxPrimitives";
import { isDesktop, prefersReducedMotion, useScrollFrame } from "./useScrollFrame";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
}

const PERU_DOTS = [
  [623, 674], [607, 649], [651, 650], [621, 624], [636, 700], [651, 674], [629, 662], [592, 624], [629, 612], [637, 624],
  [629, 637], [636, 650], [621, 650], [607, 624], [599, 637], [614, 663], [629, 688], [636, 675], [643, 663], [615, 637],
];
const TWINKLES_DESKTOP = [[598, 419], [630, 324], [994, 328], [775, 737], [648, 801]];
const TWINKLES_MOBILE = [[560, 560], [775, 737]];
const PULSES = [
  { x: 614, y: 663, r: 7 },
  { x: 599, y: 637, r: 5 },
  { x: 643, y: 663, r: 5 },
  { x: 629, y: 688, r: 5 },
  { x: 636, y: 700, r: 5 },
];

function WorldMap({ variant }: { variant: "desktop" | "mobile" }) {
  const desktop = variant === "desktop";
  const id = desktop ? "D" : "M";
  const map = fxAsset("map-world.svg");
  return (
    <svg
      viewBox={desktop ? "380 230 820 620" : "420 500 420 300"}
      preserveAspectRatio="xMidYMid meet"
      className={`block w-full ${desktop ? "h-auto overflow-visible" : "h-full overflow-hidden"}`}
    >
      <defs>
        <filter id={`mapBlur${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <radialGradient
          id={`mapFocus${id}`}
          gradientUnits="userSpaceOnUse"
          cx={desktop ? 640 : 630}
          cy={desktop ? 690 : 660}
          r={desktop ? 330 : 240}
        >
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`mapMask${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="2002" height="1017">
          <rect x="0" y="0" width="2002" height="1017" fill={`url(#mapFocus${id})`} />
        </mask>
      </defs>
      <image href={map} x="0" y="0" width="2002" height="1017" opacity={desktop ? 0.45 : 0.4} filter={`url(#mapBlur${id})`} />
      <image href={map} x="0" y="0" width="2002" height="1017" opacity={desktop ? 0.6 : 0.65} mask={`url(#mapMask${id})`} />
      {desktop && PERU_DOTS.map(([cx, cy], i) => <circle key={`p${i}`} cx={cx} cy={cy} r="4" fill="#96217A" />)}
      {(desktop ? TWINKLES_DESKTOP : TWINKLES_MOBILE).map(([cx, cy], i) => (
        <circle
          key={`t${i}`}
          cx={cx}
          cy={cy}
          r="5"
          fill="#96217A"
          className="fx-twinkle"
          style={{ animationDelay: `${desktop ? i * 1.2 : i * 2}s` }}
        />
      ))}
      {PULSES.map((p, i) => (
        <g key={`u${i}`}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill="none"
            stroke="#96217A"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="fx-pulse"
            style={{ animationDelay: `${i * 1.1}s` }}
          />
          <circle cx={p.x} cy={p.y} r={p.r} fill="#96217A" stroke="#FFFFFF" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}

export default function HomeHeroReact({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const hero = data?.home?.hero || initialData?.home?.hero;
  const mapDesktop = useRef<HTMLDivElement>(null);
  const mapMobile = useRef<HTMLDivElement>(null);

  useScrollFrame(() => {
    if (prefersReducedMotion()) return;
    const y = window.scrollY;
    if (isDesktop()) {
      if (mapDesktop.current) mapDesktop.current.style.transform = `translate3d(0,${Math.min(y, 900) * 0.18}px,0)`;
    } else if (mapMobile.current) {
      mapMobile.current.style.transform = `translate3d(0,${Math.min(y, 600) * 0.15}px,0)`;
    }
  });

  if (!hero) return null;
  const primary = hero.ctaPrimary;
  const secondary = hero.ctaSecondary;

  return (
    <section id="top" className="fx-container relative z-[1] pt-6 lg:min-h-[620px] lg:pt-24">
      <div
        ref={mapDesktop}
        aria-hidden="true"
        className="pointer-events-none absolute -right-[60px] -top-2.5 hidden w-[880px] will-change-transform lg:block"
      >
        <WorldMap variant="desktop" />
      </div>
      <div
        ref={mapMobile}
        aria-hidden="true"
        className="pointer-events-none relative -ml-[31px] h-[300px] w-[420px] will-change-transform lg:hidden"
      >
        <WorldMap variant="mobile" />
      </div>

      <div className="relative mt-2 lg:mt-0 lg:max-w-[640px]">
        <h1
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          className="m-0 text-[38px] font-normal leading-[1.1] tracking-[-.025em] text-fx-ink [text-wrap:balance] lg:text-[64px] lg:leading-[1.08]"
        >
          <span data-tina-field={tinaField(hero as any, "titleBefore")}>{tField(hero, "titleBefore", locale)}</span>{" "}
          <span className="font-semibold text-fx-purple" data-tina-field={tinaField(hero as any, "titleEmphasis")}>
            {tField(hero, "titleEmphasis", locale)}
          </span>{" "}
          <span data-tina-field={tinaField(hero as any, "titleAfter")}>{tField(hero, "titleAfter", locale)}</span>
        </h1>
        <p
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-delay="0.1"
          className="mb-0 mt-[18px] text-[16px] leading-[1.6] text-fx-body [text-wrap:pretty] lg:mt-7 lg:max-w-[500px] lg:text-[18px]"
          data-tina-field={tinaField(hero as any, "subtitle")}
        >
          {tField(hero, "subtitle", locale)}
        </p>
        <div
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-delay="0.2"
          className="mt-7 flex flex-col gap-2.5 lg:mt-10 lg:flex-row lg:gap-3.5"
        >
          {primary?.label && (
            <PillLink
              href={localizeHref(primary.href, locale)}
              iconSide="left"
              size="lg"
              className="!pr-5 lg:!pr-7"
              data-tina-field={tinaField(primary as any, "label")}
            >
              {tField(primary, "label", locale)}
            </PillLink>
          )}
          {secondary?.label && (
            <PillLink
              href={localizeHref(secondary.href, locale)}
              iconSide="left"
              size="lg"
              variant="dark"
              className="!pr-5 lg:!pr-7"
              data-tina-field={tinaField(secondary as any, "label")}
            >
              {tField(secondary, "label", locale)}
            </PillLink>
          )}
        </div>
      </div>
    </section>
  );
}
