import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{u as h,t as s}from"./react.BQi9KKXl.js";import{N as b,O as u,P as l}from"./index.PEDY4Zls.js";import f from"./DynamicFormReact.D5SseQQx.js";import"./index.Dzncr59S.js";import"./preload-helper.D43eg77A.js";const j={phone:l,email:u,location:b};function F({query:c,variables:n,data:o,form:i}){const{data:d}=h({query:c,variables:n,data:o}),a=d?.contact;if(!a)return null;const x=(a.cards||[]).filter(Boolean),m="/fiberlux-corp",r=()=>x.map((t,g)=>{const p=j[t?.icon||""]||l;return e.jsxs("div",{className:"flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4","data-tina-field":s(t,"value"),children:[e.jsx("div",{className:"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/20 text-[#D26AB6]",children:e.jsx(p,{className:"h-4 w-4"})}),e.jsxs("div",{className:"flex flex-col",children:[e.jsx("span",{className:"text-caption-sm uppercase tracking-wider text-greyscale",children:t?.label}),e.jsx("span",{className:"text-body-md text-greyscale-white",children:t?.value})]})]},g)});return e.jsxs("section",{className:"relative overflow-hidden -mt-16",style:{background:"#0a0a0a"},children:[e.jsx("div",{className:"absolute inset-0 z-0 contact-hero-bg"}),e.jsx("div",{className:"absolute inset-0 z-0 contact-hero-scrim"}),e.jsx("div",{className:"relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 pt-28 pb-20 lg:pt-36 lg:pb-28",children:e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start",children:[e.jsxs("div",{className:"max-w-[560px]",children:[e.jsxs("nav",{className:"flex items-center gap-2 text-caption-sm text-greyscale mb-6",children:[e.jsx("a",{href:m,className:"hover:text-greyscale-white transition-colors",children:"Inicio"}),e.jsx("span",{children:"/"}),e.jsx("span",{className:"text-greyscale-white","data-tina-field":s(a,"breadcrumb"),children:a.breadcrumb})]}),e.jsx("h1",{className:"hidden lg:block text-[32px] md:text-[40px] leading-[1.2] md:leading-[48px] font-semibold text-greyscale-white mb-6","data-tina-field":s(a,"heading"),children:a.heading}),e.jsx("p",{className:"hidden lg:block text-body-md text-greyscale-light max-w-[440px] mb-10","data-tina-field":s(a,"intro"),children:a.intro}),e.jsx("div",{className:"hidden lg:flex flex-col gap-4",children:r()})]}),e.jsx("div",{className:"w-full lg:max-w-[500px] lg:justify-self-end",children:e.jsx(f,{query:i.query,variables:i.variables,data:i.data})}),e.jsx("div",{className:"flex lg:hidden flex-col gap-4",children:r()})]})}),e.jsx("style",{children:`
        .contact-hero-bg {
          background-image: url(/images/nosotros/circular-gradient-bg.avif);
          background-size: cover;
          background-repeat: no-repeat;
          background-position: left -60px top -60px;
          opacity: 0.7;
        }
        .contact-hero-scrim {
          background: radial-gradient(70% 60% at 0% 0%, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0) 60%);
        }
        @media (max-width: 1023px) {
          /* On the tall mobile layout, "cover" blows the glow up over the whole
             page — anchor it to the top at a bounded size and fade it to dark. */
          .contact-hero-bg {
            opacity: 0.7;
            background-size: 170% auto;
            background-position: center top;
          }
          .contact-hero-scrim {
            background: linear-gradient(
              to bottom,
              rgba(10, 10, 10, 0) 0%,
              rgba(10, 10, 10, 0.4) 50%,
              rgba(10, 10, 10, 1) 82%
            );
          }
        }
      `})]})}export{F as default};
