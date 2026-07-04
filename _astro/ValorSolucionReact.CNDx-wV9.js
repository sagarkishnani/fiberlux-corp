import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as d}from"./index.Dzncr59S.js";import{u as b,t as s}from"./react.BQi9KKXl.js";import{d as w}from"./index.PEDY4Zls.js";function E({query:m,variables:p,data:h}){const{data:f}=b({query:m,variables:p,data:h}),c=d.useRef(null),[v,g]=d.useState(!1);d.useEffect(()=>{const l=c.current;if(!l)return;const n=new IntersectionObserver(([o])=>{o.isIntersecting&&(g(!0),n.disconnect())},{threshold:.2});return n.observe(l),()=>n.disconnect()},[]);const r=f?.service?.valor;if(!r)return null;const x=(r.cards||[]).filter(Boolean);if(x.length===0)return null;const[t,a,i]=x,u=v?"is-visible":"";return e.jsxs("section",{ref:c,className:`valor-section bg-greyscale-darkest py-16 md:py-24 ${u}`,children:[e.jsxs("div",{className:"max-w-[1264px] mx-auto px-6 md:px-16",children:[r.title&&e.jsx("h2",{className:"valor-fade text-[28px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white text-center",style:{"--d":"0s"},"data-tina-field":s(r,"title"),children:r.title}),r.subtitle&&e.jsx("p",{className:"valor-fade mt-3 text-body-md text-greyscale-light text-center max-w-[640px] mx-auto",style:{"--d":"0.08s"},"data-tina-field":s(r,"subtitle"),children:r.subtitle}),e.jsxs("div",{className:"mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5",children:[t&&e.jsxs("article",{className:"valor-card relative lg:row-span-2 flex flex-col overflow-hidden rounded-[28px] border border-white/[0.08] min-h-[300px] lg:min-h-[560px] p-7 md:p-9 bg-[radial-gradient(120%_90%_at_15%_0%,#4a1240_0%,#2c0a26_45%,#180614_100%)]",style:{"--d":"0.15s"},children:[t.heading&&e.jsx("h3",{className:"text-[22px] md:text-[26px] font-semibold text-greyscale-white mb-3","data-tina-field":s(t,"heading"),children:t.heading}),t.text&&e.jsx("p",{className:"text-body-sm md:text-body-md text-white/70 max-w-[420px]","data-tina-field":s(t,"text"),children:t.text}),t.image&&e.jsx("img",{src:t.image,alt:"","aria-hidden":"true",loading:"lazy",className:"valor-wave pointer-events-none absolute inset-x-0 bottom-6 md:bottom-10 w-full px-6 opacity-90",onError:l=>{l.currentTarget.style.display="none"}})]}),a&&e.jsxs("article",{className:"valor-card relative overflow-hidden rounded-[28px] border border-white/10 bg-[#D5A7CA] p-7 md:p-9",style:{"--d":"0.27s"},children:[a.heading&&e.jsx("h3",{className:"text-[22px] md:text-[26px] font-semibold text-[#3B0E30] mb-3","data-tina-field":s(a,"heading"),children:a.heading}),a.text&&e.jsx("p",{className:"text-body-sm md:text-body-md text-[#3B0E30]/80 max-w-[560px]","data-tina-field":s(a,"text"),children:a.text}),(()=>{const l=(a.tags||[]).filter(Boolean);return l.length===0?null:e.jsx("ul",{className:"mt-5 flex flex-wrap gap-2","data-tina-field":s(a,"tags"),children:l.map((n,o)=>e.jsx("li",{className:"inline-flex items-center rounded-full border border-[#3B0E30]/25 bg-white/40 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-[#3B0E30]",children:n},o))})})()]}),i&&e.jsxs("article",{className:"valor-card relative flex flex-col justify-start overflow-hidden rounded-[28px] min-h-[240px] p-7 md:p-9 bg-[linear-gradient(135deg,#9E2680_0%,#7c1c64_60%,#651551_100%)]",style:{"--d":"0.39s"},children:[e.jsx("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0",style:{background:"linear-gradient(122deg, transparent 38%, rgba(255,255,255,0.10) 50%, transparent 62%)"}}),e.jsx("span",{"aria-hidden":"true",className:"valor-arrow absolute right-7 md:right-9 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-[#96237A] shadow-lg",children:e.jsx(w,{className:"-rotate-45",size:24})}),e.jsxs("div",{className:"relative z-10 max-w-[62%]",children:[i.heading&&e.jsx("h3",{className:"text-[22px] md:text-[26px] font-semibold text-white mb-3","data-tina-field":s(i,"heading"),children:i.heading}),i.text&&e.jsx("p",{className:"text-body-sm text-white/85","data-tina-field":s(i,"text"),children:i.text})]})]})]})]}),e.jsx("style",{children:`
        /* Scroll-reveal: fade + rise, staggered via --d */
        .valor-fade, .valor-card {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease var(--d, 0s),
            transform 0.7s ease var(--d, 0s), box-shadow 0.4s ease;
        }
        .valor-section.is-visible .valor-fade,
        .valor-section.is-visible .valor-card {
          opacity: 1;
          transform: translateY(0);
        }

        /* Wave "signal" draws itself left → right once revealed */
        .valor-wave {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 1.1s ease 0.5s;
        }
        .valor-section.is-visible .valor-wave {
          clip-path: inset(0 0 0 0);
        }

        /* Hover: lift + magenta glow (immediate, no reveal delay) */
        @media (hover: hover) {
          .valor-section.is-visible .valor-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 24px 60px -18px rgba(150, 35, 122, 0.55);
            transition-delay: 0s;
          }
          .valor-card:hover .valor-arrow {
            transform: translateY(-50%) scale(1.06);
            transition: transform 0.35s ease;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .valor-fade, .valor-card {
            opacity: 1;
            transform: none;
            transition: box-shadow 0.4s ease;
          }
          .valor-wave { clip-path: none; transition: none; }
          .valor-section.is-visible .valor-card:hover { transform: none; }
        }
      `})]})}export{E as default};
