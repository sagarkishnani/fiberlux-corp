import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{u as n,t as s}from"./react.BQi9KKXl.js";import{S as o}from"./SplineScene.DDw7lQvU.js";import"./index.Dzncr59S.js";import"./preload-helper.D43eg77A.js";function h({query:t,variables:i,data:r}){const{data:l}=n({query:t,variables:i,data:r}),a=l?.soporteTecnico;return a?e.jsxs("section",{className:"relative overflow-hidden -mt-16",style:{background:"#0a0a0a"},children:[e.jsx("div",{className:"absolute inset-0 z-0 soporte-hero-glow"}),e.jsx("div",{className:"relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 pt-28 pb-20 lg:pt-36 lg:pb-28",children:e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center",children:[e.jsxs("div",{className:"max-w-[560px]",children:[e.jsxs("nav",{className:"flex items-center gap-2 text-caption-sm text-greyscale mb-6",children:[e.jsx("a",{href:"/fiberlux-corp",className:"hover:text-greyscale-white transition-colors",children:"Inicio"}),e.jsx("span",{children:"/"}),e.jsx("span",{className:"text-greyscale-white","data-tina-field":s(a,"breadcrumb"),children:a.breadcrumb})]}),e.jsx("h1",{className:"text-[32px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white mb-6","data-tina-field":s(a,"heading"),children:a.heading}),e.jsx("p",{className:"text-body-md text-greyscale-light max-w-[460px]","data-tina-field":s(a,"intro"),children:a.intro})]}),e.jsx("div",{className:"hidden lg:block relative w-full",style:{minHeight:440},children:a.splineSceneUrl&&e.jsx(o,{scene:a.splineSceneUrl,allowMobile:!1,featherEdges:!0,className:"absolute inset-0"})})]})}),e.jsx("style",{children:`
        .soporte-hero-glow {
          background: radial-gradient(
            55% 70% at 82% 35%,
            rgba(150, 35, 122, 0.28) 0%,
            rgba(150, 35, 122, 0) 60%
          );
        }
        @media (max-width: 1023px) {
          .soporte-hero-glow {
            background: radial-gradient(
              80% 50% at 80% 12%,
              rgba(150, 35, 122, 0.22) 0%,
              rgba(150, 35, 122, 0) 60%
            );
          }
        }
      `})]}):null}export{h as default};
