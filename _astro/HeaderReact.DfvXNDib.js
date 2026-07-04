import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as l}from"./index.Dzncr59S.js";import{u as te,t as ae}from"./react.BQi9KKXl.js";import{al as se,am as ne,an as le,ao as re,y as oe,ap as ie,aq as ce,ar as de}from"./index.PEDY4Zls.js";const xe={Facebook:de,LinkedIn:ce,Instagram:ie,WhatsApp:oe,X:re,YouTube:le,TikTok:ne,GitHub:se},he="/images/logo/fiberlux.svg",ue=50,pe=768,k=({className:r=""})=>e.jsx("svg",{className:r,fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,"aria-hidden":"true",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 5l7 7-7 7"})}),me=({className:r=""})=>e.jsx("svg",{className:r,fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,"aria-hidden":"true",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),N=r=>!!r?.children&&r.children.filter(Boolean).length>0;function we({query:r,variables:B,data:y,theme:M="dark"}){const{data:A}=te({query:r,variables:B,data:y}),u=A?.global||y?.global,T=u?.nav,R=u?.footer,O=u?.header,[n,C]=l.useState(!1),[c,L]=l.useState(null),[W,p]=l.useState(null),[m,f]=l.useState([]),[_,G]=l.useState(!1),[H,b]=l.useState(!0),F=l.useRef(0),v=l.useRef(!1),Y=O?.logo||he,$=M==="light",g=$&&!n,w=g?"bg-greyscale-darkest":"bg-white",D=g?"text-greyscale-darkest":"text-white",P=g?"brightness-0":"brightness-0 invert",d=(T?.links||[]).filter(Boolean).filter(t=>t.text!=="Inicio"),V=(R?.social||[]).filter(Boolean),x=l.useCallback(()=>{L(null),p(null),f([])},[]),X=t=>{let a=d,s=null;for(const i of t)s=a[i]||null,a=(s?.children||[]).filter(Boolean);return{node:s,children:a.filter(Boolean)}},j=l.useCallback(()=>{const t=window.scrollY;G(t>ue),v.current&&!n&&(t>F.current&&t>100?b(!1):b(!0)),F.current=t},[n]),h=l.useCallback(()=>{const t=window.innerWidth<pe;t!==v.current&&x(),v.current=t},[x]);l.useEffect(()=>(h(),window.addEventListener("scroll",j,{passive:!0}),window.addEventListener("resize",h),()=>{window.removeEventListener("scroll",j),window.removeEventListener("resize",h)}),[j,h]),l.useEffect(()=>(n?(document.body.style.overflow="hidden",b(!0)):(document.body.style.overflow="",x()),()=>{document.body.style.overflow=""}),[n,x]);const q=()=>C(t=>!t),o=()=>{C(!1),x()},S=t=>f(a=>[...a,t]),K=()=>f(t=>t.slice(0,-1)),U=n?"bg-brand-purple":_?$?"bg-white/80 backdrop-blur-md border-b border-black/5":"bg-greyscale-darkest/80 backdrop-blur-md":"bg-transparent",I=m.length,{node:J,children:Q}=X(m),E=I===1?d.filter((t,a)=>a!==m[0]):[];return e.jsxs(e.Fragment,{children:[e.jsx("header",{className:`
          fixed top-0 left-0 right-0 z-[80]
          transition-all duration-300
          ${U}
          ${H?"translate-y-0":"-translate-y-full"}
        `,children:e.jsxs("div",{className:"max-w-[1440px] mx-auto px-6 md:px-16 h-16 flex items-center justify-between relative",children:[e.jsxs("button",{onClick:q,className:`flex items-center gap-3 ${D} text-sm font-medium z-50`,"aria-label":n?"Cerrar menú":"Abrir menú","aria-expanded":n,children:[e.jsxs("div",{className:"w-7 h-3.5 relative flex flex-col justify-between",children:[e.jsx("span",{className:`
                block h-[2px] ${w} rounded-full transition-all duration-300 origin-center
                ${n?"rotate-0 translate-y-[5.5px] w-7 opacity-100":"w-7"}
              `}),e.jsx("span",{className:`
                block h-[2px] ${w} rounded-full transition-all duration-300
                ${n?"opacity-0 w-0":"w-7 opacity-100"}
              `}),e.jsx("span",{className:`
                block h-[2px] ${w} rounded-full transition-all duration-300 origin-center
                ${n?"rotate-0 -translate-y-[5.5px] w-0 opacity-0":"w-7"}
              `})]}),e.jsx("span",{className:`
              transition-all duration-300
              ${n?"opacity-100 translate-x-0":"opacity-0 -translate-x-2 absolute pointer-events-none"}
            `,children:"Cerrar"})]}),e.jsx("a",{href:"/",className:"absolute left-1/2 -translate-x-1/2 z-50","aria-label":"Fiberlux - Inicio",children:e.jsx("img",{src:Y,alt:"Fiberlux",className:`h-5 w-auto ${P}`})})]})}),e.jsx("div",{className:`
          fixed top-0 left-0 right-0 z-[70]
          bg-brand-purple
          h-screen md:h-[calc(100vh-80px)]
          md:rounded-b-[48px]
          transition-all duration-500
          ${n?"translate-y-0 opacity-100 visible ease-[cubic-bezier(0.16,1,0.3,1)]":"-translate-y-full opacity-0 invisible ease-[cubic-bezier(0.7,0,0.84,0)]"}
        `,role:"dialog","aria-modal":"true","aria-label":"Menú de navegación",children:e.jsx("div",{className:"h-full overflow-y-auto pt-20 pb-10 flex flex-col",children:e.jsxs("div",{className:"max-w-[1440px] mx-auto px-6 md:px-16 w-full flex-1 flex flex-col",children:[e.jsxs("div",{className:"hidden md:grid md:grid-cols-[1fr_1fr] flex-1 gap-16",children:[e.jsx("nav",{className:"flex flex-col justify-start pt-16 gap-1 items-start","aria-label":"Navegación principal",children:d.map((t,a)=>{const s=N(t),i=s&&c===a;return e.jsx("a",{href:t.url||"#",onClick:s?void 0:o,onMouseEnter:()=>{L(s?a:null),p(null)},className:`
                        inline text-[48px] leading-[64px] font-semibold text-white transition-all
                        nav-link-hover
                        ${i?"nav-link-active":""}
                      `,"data-tina-field":ae(t,"text"),children:t.text},a)})}),e.jsx("div",{className:`
                flex flex-col justify-start pt-16 transition-all duration-300
                ${c!==null?"opacity-100 translate-x-0":"opacity-0 translate-x-8 pointer-events-none"}
              `,children:e.jsx("nav",{className:"flex flex-col gap-4","aria-label":"Submenú",children:c!==null&&(d[c]?.children||[]).filter(Boolean).map((t,a)=>{const s=(t.children||[]).filter(Boolean),i=s.length>0,Z=W===a;return e.jsxs("div",{className:"animate-fadeIn",onMouseEnter:()=>p(i?a:null),children:[e.jsxs("a",{href:t.url||"#",onClick:o,className:"flex items-center justify-between gap-6 text-white text-lg hover:text-white/80 transition-colors group text-left",children:[e.jsx("span",{children:t.text}),e.jsx(k,{className:"w-5 h-5 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"})]}),i&&e.jsx("div",{className:`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${Z?"grid-rows-[1fr] opacity-100":"grid-rows-[0fr] opacity-0"}`,children:e.jsx("div",{className:"overflow-hidden",children:e.jsx("ul",{className:"mt-3 flex flex-col gap-1 pl-4 border-l border-white/20",children:s.map((z,ee)=>e.jsx("li",{children:e.jsx("a",{href:z.url||"#",onClick:o,className:"block text-white/70 text-[15px] py-1 hover:text-white transition-colors",children:z.text})},ee))})})})]},a)})},c)})]}),e.jsx("div",{className:"flex md:hidden flex-col flex-1",children:I===0?e.jsx("nav",{className:"flex flex-col gap-1 mb-auto pt-4","aria-label":"Navegación principal",children:d.map((t,a)=>N(t)?e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("a",{href:t.url||"#",onClick:o,className:"text-white text-[32px] leading-[44px] font-semibold hover:text-white/80 transition-colors",children:t.text}),e.jsx("button",{onClick:()=>S(a),className:"p-2 -mr-2 text-white/70 hover:text-white transition-colors","aria-label":`Ver opciones de ${t.text}`,children:e.jsx(k,{className:"w-6 h-6"})})]},a):e.jsx("a",{href:t.url||"#",onClick:o,className:"text-white text-[32px] leading-[44px] font-semibold hover:text-white/80 transition-colors",children:t.text},a))}):e.jsxs("div",{className:"pt-4 animate-fadeIn mb-auto",children:[e.jsxs("button",{onClick:K,className:"flex items-center gap-2 text-white/60 text-sm mb-6 hover:text-white transition-colors",children:[e.jsx(me,{className:"w-3.5 h-3.5"}),"Atrás"]}),e.jsx("p",{className:"text-white text-2xl font-semibold mb-5",children:J?.text}),e.jsx("nav",{className:"flex flex-col gap-1",children:Q.map((t,a)=>N(t)?e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("a",{href:t.url||"#",onClick:o,className:"text-white text-lg py-2.5 hover:text-white/80 transition-colors",children:t.text}),e.jsx("button",{onClick:()=>S(a),className:"p-2 -mr-2 text-white/70 hover:text-white transition-colors","aria-label":`Ver opciones de ${t.text}`,children:e.jsx(k,{className:"w-5 h-5"})})]},a):e.jsx("a",{href:t.url||"#",onClick:o,className:"text-white text-lg py-2.5 hover:text-white/80 transition-colors",children:t.text},a))}),E.length>0&&e.jsx("div",{className:"mt-6 pt-6 border-t border-white/20",children:e.jsx("nav",{className:"flex flex-col gap-1",children:E.map((t,a)=>e.jsx("a",{href:t.url||"#",onClick:o,className:"text-white text-lg py-2.5 hover:text-white/80 transition-colors",children:t.text},a))})})]})}),e.jsxs("div",{className:"flex items-center gap-4 mt-auto pt-4",children:[e.jsx("p",{className:"text-white/50 text-xs",children:"Síguenos"}),V.map((t,a)=>{const s=xe[t.platform||""];return s?e.jsx("a",{href:t.url||"#",target:"_blank",rel:"noopener noreferrer","aria-label":t.platform||"",className:"text-white hover:text-white/70 transition-colors",children:e.jsx(s,{className:"w-4 h-4"})},a):null})]})]})})}),e.jsx("div",{className:"h-16"}),e.jsx("style",{children:`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .nav-link-hover {
          color: white;
          text-decoration: none;
          background-image: linear-gradient(white, white);
          background-size: 0% 2px;
          background-position: left bottom 4px;
          background-repeat: no-repeat;
          transition: background-size 0.3s ease;
        }
        .nav-link-hover:hover,
        .nav-link-active {
          background-size: 100% 2px;
        }
      `})]})}export{we as default};
