import{j as a}from"./jsx-runtime.D_zvdyIk.js";import{u as m,t as r}from"./react.BQi9KKXl.js";import c from"./DynamicFormReact.D5SseQQx.js";import"./index.Dzncr59S.js";import"./preload-helper.D43eg77A.js";function u({query:i,variables:s,data:l,form:e,prefill:d}){const{data:o}=m({query:i,variables:s,data:l}),t=o?.servicios;return t?a.jsxs("section",{id:"contacto-servicios",className:"relative overflow-hidden",style:{background:"#0a0a0a",scrollMarginTop:96},children:[a.jsx("div",{className:"absolute inset-0 z-0 servicios-form-glow"}),a.jsxs("div",{className:"relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 py-14 md:py-20 lg:py-28",children:[a.jsxs("div",{className:"max-w-[720px] mx-auto text-center mb-10 lg:mb-14",children:[a.jsx("h2",{className:"text-[28px] md:text-[40px] leading-[1.2] font-semibold text-greyscale-white mb-4","data-tina-field":r(t,"formTitle"),children:t.formTitle}),t.formSubtitle&&a.jsx("p",{className:"text-body-md text-greyscale-light","data-tina-field":r(t,"formSubtitle"),children:t.formSubtitle})]}),a.jsx("div",{className:"w-full max-w-[720px] mx-auto",children:a.jsx(c,{query:e.query,variables:e.variables,data:e.data,prefill:d})})]}),a.jsx("style",{children:`
        .servicios-form-glow {
          background:
            radial-gradient(52% 58% at 88% 4%, rgba(190, 70, 158, 0.42) 0%, rgba(150, 35, 122, 0) 55%),
            radial-gradient(40% 52% at 1% 55%, rgba(150, 35, 122, 0.34) 0%, rgba(150, 35, 122, 0) 62%),
            radial-gradient(48% 46% at 22% 108%, rgba(150, 35, 122, 0.22) 0%, rgba(150, 35, 122, 0) 60%);
        }
        @media (max-width: 1023px) {
          .servicios-form-glow {
            background:
              radial-gradient(70% 30% at 82% 2%, rgba(190, 70, 158, 0.38) 0%, rgba(150, 35, 122, 0) 55%),
              radial-gradient(80% 26% at 10% 60%, rgba(150, 35, 122, 0.30) 0%, rgba(150, 35, 122, 0) 62%);
          }
        }
      `})]}):null}export{u as default};
