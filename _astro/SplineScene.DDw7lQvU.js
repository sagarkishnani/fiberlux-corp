const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/react-spline.BYWJPmzg.js","_astro/jsx-runtime.D_zvdyIk.js","_astro/index.Dzncr59S.js","_astro/preload-helper.D43eg77A.js"])))=>i.map(i=>d[i]);
import{_ as y}from"./preload-helper.D43eg77A.js";import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as t}from"./index.Dzncr59S.js";const w=t.lazy(()=>y(()=>import("./react-spline.BYWJPmzg.js"),__vite__mapDeps([0,1,2,3])));class v extends t.Component{state={failed:!1};static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(){this.props.onFail()}render(){return this.state.failed?null:this.props.children}}function S(i){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return"static";if(!window.matchMedia("(max-width: 1023px)").matches)return"spline";if(!i)return"static";const a=navigator,c=a.connection?.saveData===!0,s=a.connection?.effectiveType,l=s?["slow-2g","2g","3g"].includes(s):!1,o=typeof a.deviceMemory=="number"?a.deviceMemory<4:!1;return c||l||o?"static":"spline"}const m="radial-gradient(ellipse closest-side at 50% 45%, #000 78%, transparent 100%)";function M({scene:i,allowMobile:d=!0,featherEdges:a=!1,className:c,style:s}){const l=t.useRef(null),[o,g]=t.useState("static"),[n,h]=t.useState(!1),[b,p]=t.useState(!1);t.useEffect(()=>{g(S(d))},[d]),t.useEffect(()=>{if(o!=="spline"||!n)return;const r=l.current;if(!r)return;const f=()=>{document.hidden?r.stop():r.play()};return document.addEventListener("visibilitychange",f),()=>document.removeEventListener("visibilitychange",f)},[o,n]);const u=o==="spline"&&!b&&!!i,x=u&&!n,_=a?{...s,WebkitMaskImage:m,maskImage:m}:s??{};return e.jsxs("div",{className:c,style:_,children:[x&&e.jsxs("div",{"aria-hidden":"true",className:"spline-loader absolute inset-0 flex items-center justify-center",children:[e.jsx("div",{className:"spline-loader__glow"}),e.jsx("div",{className:"spline-loader__sweep"}),e.jsx("div",{className:"spline-loader__spinner"})]}),u&&e.jsx(v,{onFail:()=>p(!0),children:e.jsx(t.Suspense,{fallback:null,children:e.jsx(w,{scene:i,onLoad:r=>{l.current=r;try{r.setBackgroundColor?.("transparent")}catch{}h(!0)},onError:()=>p(!0),style:{width:"100%",height:"100%",background:"transparent",opacity:n?1:0,transform:n?"scale(1)":"scale(1.04)",filter:n?"blur(0px)":"blur(12px)",transition:"opacity 1.1s ease, transform 1.1s cubic-bezier(0.16,1,0.3,1), filter 1.1s ease"}})})}),e.jsx("style",{children:`
        .spline-loader__glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            42% 48% at 62% 50%,
            rgba(150, 35, 122, 0.35) 0%,
            rgba(150, 35, 122, 0) 70%
          );
          animation: splineBreath 2.6s ease-in-out infinite;
        }
        .spline-loader__sweep {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 30%;
          width: 40%;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 45%,
            rgba(255, 255, 255, 0.12) 50%,
            rgba(255, 255, 255, 0.06) 55%,
            transparent 100%
          );
          filter: blur(6px);
          animation: splineSweep 2.2s ease-in-out infinite;
        }
        .spline-loader__spinner {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 9999px;
          background: conic-gradient(
            from 0deg,
            rgba(150, 35, 122, 0) 0%,
            rgba(150, 35, 122, 0.15) 35%,
            #96237a 100%
          );
          -webkit-mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 3px),
            #000 calc(100% - 3px)
          );
          mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 3px),
            #000 calc(100% - 3px)
          );
          animation: splineSpin 0.9s linear infinite;
        }
        @keyframes splineBreath {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @keyframes splineSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes splineSweep {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spline-loader__glow,
          .spline-loader__sweep,
          .spline-loader__spinner {
            animation: none;
          }
        }
      `})]})}export{M as S};
