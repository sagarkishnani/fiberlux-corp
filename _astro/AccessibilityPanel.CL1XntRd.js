import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as n}from"./index.Dzncr59S.js";import{z as x,A as m,B as v,C as j,D as w,E as k,G as N,H as S,I as C,J as A,K as E}from"./index.PEDY4Zls.js";const b="fiberlux-a11y-v1",l={fontScale:1,letterSpacing:0,contrast:!1,saturation:!1,invert:!1,hideImages:!1,dyslexia:!1,bigCursor:!1},F=.9,z=1.6,L=1.3,P=.4,I=.12;function u(t){if(typeof document>"u")return;const r=document.documentElement;r.style.setProperty("--a11y-font-scale",String(t.fontScale)),r.style.setProperty("--a11y-letter-spacing",t.letterSpacing?`${t.letterSpacing}em`:"normal"),r.style.setProperty("--a11y-contrast",t.contrast?"1.4":"1"),r.style.setProperty("--a11y-brightness",t.contrast?"1.05":"1"),r.style.setProperty("--a11y-saturate",t.saturation?"0.12":"1"),r.style.setProperty("--a11y-invert",t.invert?"1":"0"),r.style.setProperty("--a11y-hue",t.invert?"180deg":"0deg"),r.classList.toggle("a11y-filter",t.contrast||t.saturation||t.invert),r.classList.toggle("a11y-hide-images",t.hideImages),r.classList.toggle("a11y-dyslexia",t.dyslexia),r.classList.toggle("a11y-big-cursor",t.bigCursor)}function R(){if(typeof window>"u")return l;try{const t=window.localStorage.getItem(b);return t?{...l,...JSON.parse(t)}:l}catch{return l}}function G(){const[t,r]=n.useState(!1),[a,c]=n.useState(l),f=n.useRef(null),d=n.useRef(null);n.useEffect(()=>{const i=R();c(i),u(i)},[]);const y=n.useRef(!1);n.useEffect(()=>{if(!y.current){y.current=!0;return}u(a);try{window.localStorage.setItem(b,JSON.stringify(a))}catch{}},[a]);const s=n.useCallback(i=>c(p=>({...p,...i})),[]),h=n.useCallback(()=>c(l),[]);n.useEffect(()=>{if(!t)return;const i=p=>{p.key==="Escape"&&(r(!1),d.current?.focus())};return document.addEventListener("keydown",i),f.current?.focus(),()=>document.removeEventListener("keydown",i)},[t]);const g=[a.fontScale!==1,a.letterSpacing>0,a.contrast,a.saturation,a.invert,a.hideImages,a.dyslexia,a.bigCursor].filter(Boolean).length;return e.jsxs(e.Fragment,{children:[e.jsxs("button",{ref:d,type:"button",className:"a11y-fab","aria-label":"Abrir panel de accesibilidad","aria-expanded":t,"aria-haspopup":"dialog",onClick:()=>r(!0),children:[e.jsx(x,{"aria-hidden":"true"}),g>0&&e.jsx("span",{className:"a11y-fab-badge","aria-hidden":"true",children:g})]}),e.jsx("div",{className:`a11y-backdrop ${t?"is-open":""}`,onClick:()=>r(!1),"aria-hidden":"true"}),e.jsxs("div",{ref:f,className:`a11y-panel ${t?"is-open":""}`,role:"dialog","aria-modal":"true","aria-label":"Panel de accesibilidad","aria-hidden":!t,inert:t?void 0:!0,tabIndex:-1,children:[e.jsxs("div",{className:"a11y-head",children:[e.jsxs("div",{className:"a11y-head-title",children:[e.jsx("span",{className:"a11y-head-icon","aria-hidden":"true",children:e.jsx(x,{})}),e.jsx("div",{children:e.jsx("h2",{className:"a11y-title",children:"Accesibilidad"})})]}),e.jsx("button",{type:"button",className:"a11y-close","aria-label":"Cerrar panel de accesibilidad",onClick:()=>{r(!1),d.current?.focus()},children:e.jsx(m,{"aria-hidden":"true"})})]}),e.jsx("p",{className:"a11y-subtitle",children:"Ajusta la experiencia visual a tus necesidades"}),e.jsxs("div",{className:"a11y-body",children:[e.jsx("p",{className:"a11y-section-label",children:"Visual"}),e.jsxs("div",{className:"a11y-grid",children:[e.jsx(o,{icon:e.jsx(v,{}),label:"Contraste +",active:a.contrast,onClick:()=>s({contrast:!a.contrast})}),e.jsx(o,{icon:e.jsx(j,{}),label:"Agrandar texto",active:a.fontScale>1,onClick:()=>s({fontScale:a.fontScale>1?1:L})}),e.jsx(o,{icon:e.jsx(w,{}),label:"Espaciado entre letras",active:a.letterSpacing>0,onClick:()=>s({letterSpacing:a.letterSpacing>0?0:I})}),e.jsx(o,{icon:e.jsx(k,{}),label:"Ocultar imágenes",active:a.hideImages,onClick:()=>s({hideImages:!a.hideImages})}),e.jsx(o,{icon:e.jsx(N,{}),label:"Dislexia Amigable",active:a.dyslexia,onClick:()=>s({dyslexia:!a.dyslexia})}),e.jsx(o,{icon:e.jsx(S,{}),label:"Saturación",active:a.saturation,onClick:()=>s({saturation:!a.saturation})})]}),e.jsx("p",{className:"a11y-section-label",children:"Navegación"}),e.jsxs("div",{className:"a11y-grid",children:[e.jsx(o,{icon:e.jsx(C,{}),label:"Invertir colores",active:a.invert,onClick:()=>s({invert:!a.invert})}),e.jsx(o,{icon:e.jsx(A,{}),label:"Cursor grande",active:a.bigCursor,onClick:()=>s({bigCursor:!a.bigCursor})})]}),e.jsx("p",{className:"a11y-section-label",children:"Ajuste fino"}),e.jsxs("div",{className:"a11y-slider-row",children:[e.jsx("label",{htmlFor:"a11y-font",className:"a11y-slider-label",children:"Texto"}),e.jsx("input",{id:"a11y-font",type:"range",min:F,max:z,step:.05,value:a.fontScale,onChange:i=>s({fontScale:Number(i.target.value)}),className:"a11y-range"}),e.jsxs("span",{className:"a11y-slider-value",children:[Math.round(a.fontScale*100),"%"]})]}),e.jsxs("div",{className:"a11y-slider-row",children:[e.jsx("label",{htmlFor:"a11y-spacing",className:"a11y-slider-label",children:"Espaciado"}),e.jsx("input",{id:"a11y-spacing",type:"range",min:0,max:P,step:.05,value:a.letterSpacing,onChange:i=>s({letterSpacing:Number(i.target.value)}),className:"a11y-range"}),e.jsx("span",{className:"a11y-slider-value",children:a.letterSpacing.toFixed(2)})]}),e.jsxs("button",{type:"button",className:"a11y-reset",onClick:h,children:[e.jsx(E,{"aria-hidden":"true"}),"Restablecer valores"]})]})]}),e.jsx("style",{children:T})]})}function o({icon:t,label:r,active:a,onClick:c}){return e.jsxs("button",{type:"button",className:`a11y-card ${a?"is-active":""}`,"aria-pressed":a,onClick:c,children:[e.jsx("span",{className:"a11y-card-icon","aria-hidden":"true",children:t}),e.jsx("span",{className:"a11y-card-label",children:r})]})}const T=`
  /* ─── Global page effects (applied to the whole document) ───
     These live here (not in global.css, which is not bundled) so they
     actually ship: this <style> is server-rendered with the island. */
  :root {
    --a11y-font-scale: 1;
    --a11y-letter-spacing: normal;
    --a11y-saturate: 1;
    --a11y-contrast: 1;
    --a11y-brightness: 1;
    --a11y-invert: 0;
    --a11y-hue: 0deg;
  }

  /* Scale rem-based typography (font slider / "Agrandar texto") */
  html {
    font-size: calc(100% * var(--a11y-font-scale));
  }

  /* Letter spacing (identity default is safe to always apply) */
  body {
    letter-spacing: var(--a11y-letter-spacing);
  }

  /* Composed visual filter (contrast / saturation / invert).
     Applied to the page-content wrapper (#a11y-content) — NOT <body> — and
     gated behind .a11y-filter. A non-"none" filter establishes a containing
     block that breaks position:fixed, so the accessibility controls (and other
     FABs) live OUTSIDE #a11y-content to stay fixed and reachable, and we only
     apply the filter while a color effect is actually enabled. */
  html.a11y-filter #a11y-content {
    filter: saturate(var(--a11y-saturate)) contrast(var(--a11y-contrast))
      brightness(var(--a11y-brightness)) invert(var(--a11y-invert))
      hue-rotate(var(--a11y-hue));
  }

  /* Dyslexia-friendly font */
  html.a11y-dyslexia body,
  html.a11y-dyslexia body * {
    font-family: "Atkinson Hyperlegible", "Poppins", system-ui, sans-serif !important;
  }

  /* Hide decorative / content images */
  html.a11y-hide-images :is(img, picture, video, canvas) {
    visibility: hidden !important;
  }

  /* Large cursor */
  html.a11y-big-cursor,
  html.a11y-big-cursor * {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M9 5 L9 41 L19 31 L25 45 L31 42 L25 28 L39 28 Z' fill='%23ffffff' stroke='%23000000' stroke-width='2.5' stroke-linejoin='round'/%3E%3C/svg%3E")
        7 5,
      auto !important;
  }

  .a11y-fab {
    position: fixed;
    left: clamp(16px, 3vw, 28px);
    bottom: clamp(16px, 3vw, 28px);
    z-index: 90;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    border: none;
    background: #96237A;
    color: #fff;
    font-size: 28px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(150, 35, 122, 0.45);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .a11y-fab:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 12px 30px rgba(150, 35, 122, 0.6);
  }
  .a11y-fab:focus-visible {
    outline: 3px solid rgba(150, 35, 122, 0.5);
    outline-offset: 2px;
  }
  .a11y-fab-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 9999px;
    background: #fff;
    color: #650F50;
    font-family: "Poppins", system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 20px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .a11y-backdrop {
    position: fixed;
    inset: 0;
    z-index: 95;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
  .a11y-backdrop.is-open {
    opacity: 1;
    visibility: visible;
  }

  .a11y-panel {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 96;
    display: flex;
    flex-direction: column;
    width: min(380px, 90vw);
    height: 100dvh;
    background: #0A0A0A;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 12px 0 40px rgba(0, 0, 0, 0.5);
    transform: translateX(-105%);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: "Poppins", system-ui, sans-serif;
  }
  .a11y-panel.is-open {
    transform: translateX(0);
  }

  .a11y-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 0;
  }
  .a11y-head-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .a11y-head-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #96237A;
    color: #fff;
    font-size: 20px;
  }
  .a11y-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    line-height: 40px;
  }
  .a11y-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    font-size: 20px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .a11y-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .a11y-close:focus-visible {
    outline: 2px solid #96237A;
    outline-offset: 2px;
  }
  .a11y-subtitle {
    margin: 6px 24px 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .a11y-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px 28px;
  }

  .a11y-section-label {
    margin: 4px 0 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
  }
  .a11y-section-label:not(:first-child) {
    margin-top: 28px;
  }

  .a11y-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .a11y-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 96px;
    padding: 16px 10px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.85);
    font-family: inherit;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.2s ease, background 0.2s ease,
      transform 0.1s ease;
  }
  .a11y-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .a11y-card:active {
    transform: scale(0.97);
  }
  .a11y-card:focus-visible {
    outline: 2px solid #96237A;
    outline-offset: 2px;
  }
  .a11y-card.is-active {
    border-color: #96237A;
    background: rgba(150, 35, 122, 0.18);
    color: #fff;
  }
  .a11y-card-icon {
    font-size: 22px;
    color: rgba(255, 255, 255, 0.65);
  }
  .a11y-card.is-active .a11y-card-icon {
    color: #D5A7CA;
  }
  .a11y-card-label {
    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
  }

  .a11y-slider-row {
    display: grid;
    grid-template-columns: 78px 1fr 48px;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .a11y-slider-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
  }
  .a11y-slider-value {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    text-align: right;
  }
  .a11y-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.12);
    outline: none;
    cursor: pointer;
  }
  .a11y-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #96237A;
    border: 2px solid #fff;
    cursor: pointer;
  }
  .a11y-range::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #96237A;
    border: 2px solid #fff;
    cursor: pointer;
  }
  .a11y-range:focus-visible {
    outline: 2px solid rgba(150, 35, 122, 0.6);
    outline-offset: 4px;
  }

  .a11y-reset {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 12px;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }
  .a11y-reset:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
  }
  .a11y-reset:focus-visible {
    outline: 2px solid #96237A;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .a11y-fab,
    .a11y-backdrop,
    .a11y-panel,
    .a11y-card {
      transition: none;
    }
    .a11y-fab:hover {
      transform: none;
    }
  }
`;export{G as default};
