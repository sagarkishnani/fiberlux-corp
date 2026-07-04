import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{t as i,u as d}from"./react.BQi9KKXl.js";import"./index.Dzncr59S.js";function c({partners:t}){if(!t)return null;const r=(t.logos||[]).filter(Boolean);if(r.length===0)return null;const n=Array.from({length:4},()=>r).flat(),s=[...n,...n],l=(a,m)=>{const o=e.jsx("img",{src:a.image||"",alt:a.alt||"Partner",loading:"lazy",className:"partner-logo h-7 md:h-9 w-auto object-contain"});return e.jsx("span",{className:"shrink-0 px-8 md:px-12","data-tina-field":i(a,"image"),children:a.url?e.jsx("a",{href:a.url,target:"_blank",rel:"noopener noreferrer",children:o}):o},m)};return e.jsxs("section",{className:"bg-greyscale-darkest py-16 md:py-20 overflow-hidden",children:[e.jsxs("div",{className:"max-w-[1440px] mx-auto px-6 text-center mb-10 md:mb-14",children:[t.eyebrow&&e.jsx("p",{className:"font-mono text-xs md:text-sm tracking-[0.2em] text-white/50 uppercase mb-4","data-tina-field":i(t,"eyebrow"),children:t.eyebrow}),t.title&&e.jsx("h2",{className:"text-subtitle-md md:text-subtitle-lg text-white","data-tina-field":i(t,"title"),children:t.title})]}),e.jsx("div",{className:"partners-marquee w-full overflow-hidden",children:e.jsx("div",{className:"partners-track flex w-max items-center","aria-hidden":"false",children:s.map(l)})}),e.jsx("style",{children:`
        .partner-logo { opacity: 1; filter: none; transition: filter 0.35s ease, opacity 0.35s ease; }
        @media (min-width: 768px) {
          .partner-logo { filter: brightness(0) invert(1); opacity: 0.55; }
          .partner-logo:hover { filter: none; opacity: 1; }
        }

        .partners-marquee {
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
        }
        .partners-track {
          animation: partners-marquee 42s linear infinite;
        }
        /* Left → right motion; both halves identical so the reset is seamless. */
        @keyframes partners-marquee {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .partners-marquee:hover .partners-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .partners-track { animation: none; transform: translateX(0); }
          .partner-logo { transition: none; }
        }
      `})]})}function x({query:t,variables:r,data:n}){const{data:s}=d({query:t,variables:r,data:n});return e.jsx(c,{partners:s?.service?.partners})}export{x as default};
