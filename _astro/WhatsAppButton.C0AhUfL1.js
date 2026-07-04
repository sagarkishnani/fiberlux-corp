import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{y as n}from"./index.PEDY4Zls.js";import"./index.Dzncr59S.js";const a="51986176790",s="¡Hola Fiberlux! Quiero iniciar la Transformación Digital de mi empresa. 🛜 Mi número de RUC es:";function l({phone:o=a,message:t=s}){const r=`https://api.whatsapp.com/send?phone=${(o||a).replace(/\D/g,"")}&text=${encodeURIComponent(t)}`;return e.jsxs("a",{href:r,target:"_blank",rel:"noopener noreferrer","aria-label":"Contáctanos por WhatsApp",className:"wa-fab",children:[e.jsx(n,{"aria-hidden":"true"}),e.jsx("style",{children:`
        .wa-fab {
          position: fixed;
          right: clamp(16px, 3vw, 28px);
          bottom: clamp(16px, 3vw, 28px);
          z-index: 60;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          background: #25D366;
          color: #fff;
          font-size: 30px;
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .wa-fab:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 30px rgba(37, 211, 102, 0.55);
        }
        .wa-fab:focus-visible {
          outline: 3px solid rgba(37, 211, 102, 0.4);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-fab { transition: none; }
          .wa-fab:hover { transform: none; }
        }
      `})]})}export{l as default};
