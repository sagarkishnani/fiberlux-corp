import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{u as k,t as x}from"./react.BQi9KKXl.js";import"./index.Dzncr59S.js";function I({query:r,variables:f,data:m}){const{data:p}=k({query:r,variables:f,data:m}),h=p?.about,v=m?.about,l=h?.values,n=v?.values,b=l?.title||n?.title||"",g=l?.subtitle||n?.subtitle||"",c=(l?.items||[]).filter(Boolean),j=(n?.items||[]).filter(Boolean),t=c.length>0?c:j;if(t.length===0)return null;const i=l||n,u=Math.ceil(t.length/2),w=t.slice(0,u),N=t.slice(u),o=a=>[...a,...a,...a];return e.jsxs("section",{className:"bg-white overflow-hidden",children:[e.jsx("div",{className:"max-w-[1440px] mx-auto py-16 md:py-20",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-0",children:[e.jsxs("div",{className:"flex flex-col justify-center px-6 md:px-16 mb-10 md:mb-0",children:[e.jsx("h2",{className:"text-[40px] md:text-[48px] leading-[120%] font-medium mb-6",style:{color:"#6C1958"},"data-tina-field":i?x(i,"title"):void 0,children:b}),e.jsx("p",{className:"text-base leading-relaxed max-w-md",style:{color:"rgba(108, 25, 88, 0.7)"},"data-tina-field":i?x(i,"subtitle"):void 0,children:g})]}),e.jsxs("div",{className:"hidden md:grid grid-cols-2 gap-4 h-[500px] overflow-hidden marquee-container",children:[e.jsx("div",{className:"relative overflow-hidden",children:e.jsx("div",{className:"values-marquee-up flex flex-col gap-4",children:o(w).map((a,s)=>e.jsx(d,{item:a},`l-${s}`))})}),e.jsx("div",{className:"relative overflow-hidden",children:e.jsx("div",{className:"values-marquee-down flex flex-col gap-4",children:o(N).map((a,s)=>e.jsx(d,{item:a},`r-${s}`))})})]}),e.jsx("div",{className:"md:hidden h-[400px] overflow-hidden marquee-container",children:e.jsx("div",{className:"values-marquee-down flex flex-col gap-4 px-6",children:o(t).map((a,s)=>e.jsx(d,{item:a},`m-${s}`))})})]})}),e.jsx("style",{children:`
        @keyframes marqueeUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-33.33%); }
        }
        @keyframes marqueeDown {
          0% { transform: translateY(-33.33%); }
          100% { transform: translateY(0); }
        }
        .values-marquee-up {
          animation: marqueeUp 20s linear infinite;
        }
        .values-marquee-down {
          animation: marqueeDown 20s linear infinite;
        }
        .values-marquee-up:hover,
        .values-marquee-down:hover {
          animation-play-state: paused;
        }
        .marquee-container {
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
        }
      `})]})}function d({item:r}){return e.jsx("div",{className:"flex items-center justify-center shrink-0",style:{background:"rgba(150, 35, 122, 0.06)",border:"1px solid rgba(150, 35, 122, 0.1)",borderRadius:"14px",aspectRatio:"7 / 5",padding:"24px"},children:e.jsx("span",{className:"text-sm font-medium text-center",style:{color:"#7F1866"},children:r.name})})}export{I as default};
