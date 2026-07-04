import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as i}from"./index.Dzncr59S.js";import{u as W,t as y}from"./react.BQi9KKXl.js";import{c as _,d as G}from"./index.PEDY4Zls.js";const F=1e3;function J(){const[a,u]=i.useState(!1);return i.useEffect(()=>{const o=window.matchMedia("(prefers-reduced-motion: reduce)"),l=()=>u(o.matches);return l(),o.addEventListener("change",l),()=>o.removeEventListener("change",l)},[]),a}function Y({activeKey:a,direction:u,reduced:o,windowClass:l="",render:c}){const[m,s]=i.useState(a),[r,f]=i.useState(null),p=i.useRef(0);if(a!==m){const j=m;s(a),o?f(null):(p.current+=1,f({outgoing:j,direction:u,nonce:p.current}))}const b=r?.nonce;i.useEffect(()=>{if(b==null)return;const j=setTimeout(()=>{f(g=>g&&g.nonce===b?null:g)},F);return()=>clearTimeout(j)},[b]);const h=r?`tl-anim tl-in-${r.direction}`:"";return e.jsxs("div",{className:`relative overflow-hidden ${l}`,children:[e.jsx("div",{className:h,children:c(a)},`cur-${a}`),r&&e.jsx("div",{className:`absolute inset-0 tl-anim tl-out-${r.direction}`,"aria-hidden":"true",children:c(r.outgoing)},`out-${r.outgoing}-${r.nonce}`)]})}function Q(a,u,o){const l=parseInt(a,10),c=parseInt(u,10),m=parseInt(o,10);return isNaN(l)||isNaN(c)||isNaN(m)?0:m===c?1:Math.min(1,Math.max(0,(l-c)/(m-c)))}function ee({query:a,variables:u,data:o}){const{data:l}=W({query:a,variables:u,data:o}),c=l?.about?.timeline,m=o?.about?.timeline,s=c||m,r=s?.startYear||"",f=s?.endYear||"",p=(c?.milestones||[]).filter(Boolean),b=(m?.milestones||[]).filter(Boolean),h=p.length>0?p:b,[j,g]=i.useState(0),[k,S]=i.useState("next"),[$,I]=i.useState(!1),[O,B]=i.useState(0),v=J(),n=h.length,x=n>0?j%n:0,H=h[x];if(i.useEffect(()=>{if($||v||n<=1)return;const t=setInterval(()=>{S("next"),g(d=>(d+1)%n)},5e3);return()=>clearInterval(t)},[$,v,n,O]),h.length===0)return null;const E=(t,d)=>{S(d),g((t%n+n)%n),B(N=>N+1)},K=()=>E(x-1,"prev"),q=()=>E(x+1,"next"),T=t=>h[(t%n+n)%n],z=t=>{const d=(t%n+n)%n;return p[d]||b[d]},D=Q(H?.year||"",r,f),C=(t,d)=>{const N=T(t),w=z(t);return e.jsx("span",{className:`block font-bold leading-none tracking-tighter tabular-nums text-[#836d7d] ${d}`,"data-tina-field":w?y(w,"year"):void 0,children:N?.year})},M=(t,d)=>{const N=T(t),w=z(t);return e.jsx("h2",{className:`max-w-[900px] font-medium leading-[1.15] tracking-tight text-white ${d}`,"data-tina-field":w?y(w,"heading"):void 0,children:N?.heading})},P=e.jsxs("div",{className:"flex w-fit overflow-hidden rounded-[12px] border-2 border-[#282445] bg-[#141223]",children:[e.jsx("button",{type:"button","aria-label":"Hito anterior",onClick:K,className:"flex h-[49px] w-[49px] items-center justify-center bg-[#141223] text-white opacity-40 transition-opacity hover:opacity-100",children:e.jsx(_,{className:"text-sm"})}),e.jsx("button",{type:"button","aria-label":"Hito siguiente",onClick:q,className:"flex h-[49px] w-[49px] items-center justify-center bg-[#96237a] text-white transition-colors hover:bg-[#b02a92]",children:e.jsx(G,{className:"text-sm"})})]}),R=s?.title?e.jsx("p",{className:"mb-4 text-sm uppercase tracking-[0.15em] text-[#909da4]","data-tina-field":y(s,"title"),children:s.title}):null,A=e.jsx("div",{className:"relative h-[2px] w-full overflow-hidden rounded-full bg-[#394247]",children:e.jsx("div",{className:"timeline-bar-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#080618] to-[#96237a]",style:{width:`${D*100}%`}})}),L=e.jsxs("div",{className:"mt-3 flex justify-between",children:[e.jsx("span",{className:"text-base uppercase tracking-tight text-[#909da4]","data-tina-field":s?y(s,"startYear"):void 0,children:r}),e.jsx("span",{className:"text-base uppercase tracking-tight text-[#909da4]","data-tina-field":s?y(s,"endYear"):void 0,children:f})]});return e.jsxs("section",{className:"relative overflow-hidden rounded-t-3xl bg-[#080618] pb-20",onMouseEnter:()=>I(!0),onMouseLeave:()=>I(!1),onFocusCapture:()=>I(!0),onBlurCapture:()=>I(!1),children:[e.jsxs("div",{className:"pointer-events-none absolute inset-0 z-0 overflow-hidden","aria-hidden":"true",children:[e.jsx("div",{className:"absolute inset-0",style:{background:"radial-gradient(75% 60% at 88% 2%, rgba(150,35,122,0.55) 0%, rgba(150,35,122,0.18) 32%, rgba(8,6,24,0) 62%)"}}),e.jsx("div",{className:"absolute -top-1/3 right-[6%] h-[170%] w-[220px] rotate-[35deg] origin-top opacity-80 blur-[40px]",style:{background:"linear-gradient(to bottom, rgba(214,77,184,0.9) 0%, rgba(150,35,122,0.35) 45%, rgba(150,35,122,0) 80%)"}}),e.jsx("div",{className:"absolute -top-1/3 right-[20%] h-[160%] w-[340px] rotate-[35deg] origin-top opacity-40 blur-[60px]",style:{background:"linear-gradient(to bottom, rgba(150,35,122,0.7) 0%, rgba(150,35,122,0) 70%)"}})]}),e.jsxs("div",{className:"relative z-20 mx-auto hidden max-w-[1440px] md:block md:min-h-[852px]",children:[e.jsx("div",{className:"absolute left-[92px] top-12 z-20",children:P}),e.jsx("div",{className:"pointer-events-none absolute inset-x-0 top-[120px] z-10 flex justify-center",children:e.jsx(Y,{activeKey:x,direction:k,reduced:v,windowClass:"inline-block",render:t=>C(t,"text-[255px]")})}),e.jsxs("div",{className:"absolute bottom-[60px] left-[92px] right-[92px] z-10",children:[R,e.jsx(Y,{activeKey:x,direction:k,reduced:v,windowClass:"mb-8",render:t=>M(t,"text-[48px]")}),A,L]})]}),e.jsxs("div",{className:"relative z-10 flex min-h-[520px] flex-col px-6 pb-10 pt-14 md:hidden",children:[R,e.jsx(Y,{activeKey:x,direction:k,reduced:v,render:t=>M(t,"text-[28px]")}),e.jsx("div",{className:"my-4 flex justify-end",children:e.jsx(Y,{activeKey:x,direction:k,reduced:v,windowClass:"inline-block",render:t=>C(t,"text-[88px] opacity-60")})}),e.jsxs("div",{className:"mt-auto",children:[A,L,e.jsx("div",{className:"mt-8",children:P})]})]}),e.jsx("style",{children:`
        .timeline-bar-fill {
          transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tl-anim {
          animation-duration: ${F}ms;
          animation-timing-function: cubic-bezier(0.544, 0.001, 0, 0.995);
          animation-fill-mode: both;
          will-change: transform;
        }
        .tl-in-next { animation-name: tlInNext; }
        .tl-out-next { animation-name: tlOutNext; }
        .tl-in-prev { animation-name: tlInPrev; }
        .tl-out-prev { animation-name: tlOutPrev; }
        @keyframes tlInNext {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes tlOutNext {
          from { transform: translateY(0); }
          to { transform: translateY(-100%); }
        }
        @keyframes tlInPrev {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes tlOutPrev {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .timeline-bar-fill { transition: none; }
          .tl-anim { animation: none !important; }
        }
      `})]})}export{ee as default};
