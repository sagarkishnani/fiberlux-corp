import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{u as d,t as i}from"./react.BQi9KKXl.js";import"./index.Dzncr59S.js";function u({query:o,variables:l,data:a}){const{data:r}=d({query:o,variables:l,data:a}),t=(r?.about||a?.about)?.hero,n=t?.title||"La red que impulsa a las empresas del Perú",s=t?.subtitle||"";return e.jsxs("section",{className:"relative min-h-[70vh] md:min-h-[85vh] flex flex-col overflow-hidden -mt-16",style:{background:"#0a0a0a"},children:[e.jsx("div",{className:"absolute inset-0 z-0 hero-nosotros-bg"}),e.jsxs("div",{className:"relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 w-full flex flex-col flex-1",children:[e.jsx("nav",{className:"pt-24 md:pt-28","aria-label":"Breadcrumb",children:e.jsxs("ol",{className:"flex items-center gap-2 text-sm",children:[e.jsx("li",{children:e.jsx("a",{href:"/",className:"text-white/50 hover:text-white transition-colors",children:"Inicio"})}),e.jsx("li",{className:"text-white/30",children:"/"}),e.jsx("li",{className:"text-white font-medium",children:"Nosotros"})]})}),e.jsx("div",{className:"flex-1"}),e.jsx("h1",{className:"text-[36px] md:text-[64px] leading-[110%] font-medium text-white max-w-3xl mb-4 md:mb-6","data-tina-field":t?i(t,"title"):void 0,children:n}),s&&e.jsx("p",{className:"text-white/60 text-sm md:text-base leading-relaxed max-w-xl mb-16 md:mb-20","data-tina-field":t?i(t,"subtitle"):void 0,children:s})]}),e.jsx("style",{children:`
        .hero-nosotros-bg {
          background-image: url(/images/nosotros/circular-gradient-bg.avif);
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center 70%;
        }
        @media (min-width: 768px) {
          .hero-nosotros-bg {
            background-position: center top;
          }
        }
      `})]})}export{u as default};
