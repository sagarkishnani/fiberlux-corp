import{R as o}from"./index.Dzncr59S.js";function M(e){const t=JSON.stringify({query:e.query,variables:e.variables}),a=o.useMemo(()=>N(t),[t]),n=o.useMemo(()=>{if(e.data){const m=JSON.parse(JSON.stringify(e.data));return g(a,m,[])}},[e.data,a]),[i,r]=o.useState(n),[f,v]=o.useState(!1),[p,h]=o.useState(!1),[b,w]=o.useState(!1);return o.useEffect(()=>{v(!0),r(n),parent.postMessage({type:"url-changed"})},[a,n]),o.useEffect(()=>{if(p){let m=function(s){const y=s.target.getAttributeNames().find(l=>l.startsWith("data-tina-field"));let c;if(y)s.preventDefault(),s.stopPropagation(),c=s.target.getAttribute(y);else{const l=s.target.closest("[data-tina-field], [data-tina-field-overlay]");if(l){const _=l.getAttributeNames().find(S=>S.startsWith("data-tina-field"));_&&(s.preventDefault(),s.stopPropagation(),c=l.getAttribute(_))}}c&&b&&parent.postMessage({type:"field:selected",fieldName:c},window.location.origin)};const u=document.createElement("style");return u.type="text/css",u.textContent=`
        [data-tina-field] {
          outline: 2px dashed rgba(34,150,254,0.5);
          transition: box-shadow ease-out 150ms;
        }
        [data-tina-field]:hover {
          box-shadow: inset 100vi 100vh rgba(34,150,254,0.3);
          outline: 2px solid rgba(34,150,254,1);
          cursor: pointer;
        }
        [data-tina-field-overlay] {
          outline: 2px dashed rgba(34,150,254,0.5);
          position: relative;
        }
        [data-tina-field-overlay]:hover {
          cursor: pointer;
          outline: 2px solid rgba(34,150,254,1);
        }
        [data-tina-field-overlay]::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 20;
          transition: opacity ease-out 150ms;
          background-color: rgba(34,150,254,0.3);
          opacity: 0;
        }
        [data-tina-field-overlay]:hover::after {
          opacity: 1;
        }
      `,document.head.appendChild(u),document.body.classList.add("__tina-quick-editing-enabled"),document.addEventListener("click",m,!0),()=>{document.removeEventListener("click",m,!0),document.body.classList.remove("__tina-quick-editing-enabled"),u.remove()}}},[p,b]),o.useEffect(()=>{e?.experimental___selectFormByFormId&&parent.postMessage({type:"user-select-form",formId:e.experimental___selectFormByFormId()})},[a]),o.useEffect(()=>{const{experimental___selectFormByFormId:m,...u}=e;parent.postMessage({type:"open",...u,id:a},window.location.origin);const s=d=>{if(d.data.type==="quickEditEnabled"&&h(d.data.value),d.data.id===a&&d.data.type==="updateData"){const y=d.data.data,c=g(a,JSON.parse(JSON.stringify(y)),[]);r(c),w(!0),document.querySelector("[data-tina-field]")?parent.postMessage({type:"quick-edit",value:!0},window.location.origin):parent.postMessage({type:"quick-edit",value:!1},window.location.origin)}};return window.addEventListener("message",s),()=>{window.removeEventListener("message",s),parent.postMessage({type:"close",id:a},window.location.origin)}},[a,h]),{data:i,isClient:f}}const k=(e,t,a)=>{const n=e?._content_source;if(!n)return"";const{queryId:i,path:r}=n;if(!t)return`${i}---${r.join(".")}`;const f=typeof a=="number"?[...r,t,a]:[...r,t];return`${i}---${f.join(".")}`},g=(e,t,a=[])=>{if(t===null||E(t))return t;if(t instanceof String)return t.valueOf();if(Array.isArray(t))return t.map((i,r)=>g(e,i,[...a,r]));const n={};for(const[i,r]of Object.entries(t)){const f=[...a,i];["__typename","_sys","_internalSys","_values","_internalValues","_content_source","_tina_metadata"].includes(i)?n[i]=r:n[i]=g(e,r,f)}return n&&typeof n=="object"&&"type"in n&&n.type==="root"?n:{...n,_content_source:{queryId:e,path:a}}};function E(e){const t=typeof e;return t==="string"||t==="number"||t==="boolean"||t==="undefined"||e==null||e instanceof String||e instanceof Number||e instanceof Boolean}const N=e=>{let t=0;for(let i=0;i<e.length;i++){const r=e.charCodeAt(i);t=(t<<5)-t+r&4294967295}return Math.abs(t).toString(36)};export{k as t,M as u};
