import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{u as x,t as o}from"./react.BQi9KKXl.js";import{T as n,ag as p,ab as u,ah as g,aa as h,ai as m,Z as b,ad as f,a1 as v,W as w,aj as j,ak as y}from"./index.PEDY4Zls.js";import"./index.Dzncr59S.js";const F={velocidad:y,simetria:j,soporte:w,escudo:v,disponibilidad:f,nube:b,reloj:m,red:h,ahorro:g,cobertura:u,escalabilidad:p,generico:n};function N({name:i}){const r=i&&F[i]||n;return e.jsx("span",{className:"beneficio-icon relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#96237A]/15 text-[#c65fac] transition-all duration-300 ease-out group-hover:bg-[#96237A]/30 group-hover:text-white group-hover:scale-105",children:e.jsx(r,{size:22})})}function C({query:i,variables:r,data:l}){const{data:d}=x({query:i,variables:r,data:l}),t=d?.subservicio?.beneficios;if(!t)return null;const s=(t.items||[]).filter(Boolean);return s.length===0?null:e.jsxs("section",{className:"bg-greyscale-darkest py-16 md:py-24",children:[e.jsxs("div",{className:"max-w-[1264px] mx-auto px-6 md:px-16",children:[t.title&&e.jsx("h2",{className:"text-[28px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white text-center mb-10 md:mb-14","data-tina-field":o(t,"title"),children:t.title}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5",children:s.map((a,c)=>e.jsxs("div",{className:"beneficio-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#96237A]/60 hover:bg-white/[0.06] hover:shadow-[0_18px_40px_-20px_rgba(150,35,122,0.7)]",children:[e.jsx("span",{"aria-hidden":"true",className:"beneficio-glow pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100"}),e.jsx(N,{name:a.icon}),a.title&&e.jsx("h3",{className:"relative z-10 mt-5 text-[18px] lg:text-[20px] font-semibold text-greyscale-white","data-tina-field":o(a,"title"),children:a.title}),a.text&&e.jsx("p",{className:"relative z-10 mt-3 text-body-sm text-greyscale-light","data-tina-field":o(a,"text"),children:a.text})]},c))})]}),e.jsx("style",{children:`
        .beneficio-glow {
          background: radial-gradient(
            circle at 30% 20%,
            rgba(150, 35, 122, 0.45) 0%,
            rgba(150, 35, 122, 0.14) 34%,
            rgba(150, 35, 122, 0) 64%
          );
          filter: blur(26px);
        }
        @media (prefers-reduced-motion: reduce) {
          .beneficio-card, .beneficio-icon, .beneficio-glow {
            transition-duration: 0.01ms !important;
          }
          .beneficio-card:hover { transform: none !important; }
        }
      `})]})}export{C as default};
