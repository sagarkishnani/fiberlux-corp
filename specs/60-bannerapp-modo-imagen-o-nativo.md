# SPEC 60 — BannerApp: modo nativo o imagen (toggle en Tina)

> **Estado:** Implementado
> **Depende de:** SPEC 53 (banner app), SPEC 37 (página fiberlux-app)
> **Fecha:** 2026-07-22
> **Objetivo:** Permitir elegir en Tina entre el banner nativo actual y una versión de solo imagen (3 imágenes responsive con border-radius, fondo configurable y enlace a `/fiberlux-app`) para el `BannerApp` de home y nosotros.

---

## Por qué este spec existe

Hoy el `BannerApp` (home y nosotros) es 100% nativo: panel con degradé negro→magenta, mockup del teléfono, titular, bullets y botón de descarga. El cliente quiere poder cambiarlo, desde Tina, por una versión de **solo imagen** (con las 3 imágenes responsive que entregó), con un fondo configurable y que al hacer clic lleve a la página `/fiberlux-app` — sin perder la opción de volver al banner nativo editable.

---

## Scope

**In:**

- Campo `mode` (`nativa` | `imagen`) en el grupo `banner` de `tina/config.ts`. Default `nativa`; el contenido se deja en **`imagen`**.
- **Modo imagen:** 3 imágenes responsive **editables** (mobile ≤600 / tablet ≤1024 / desktop), color de fondo **editable** (default `#0a0a0a`), **border-radius ligero**, y **todo el banner enlaza a `/fiberlux-app`**. Imagen con alto proporcional (width 100%, height auto).
- **Modo nativa:** comportamiento actual sin cambios.
- `BannerAppReact` renderiza condicionalmente según `mode`.
- Renombrar las 3 imágenes a slugs sin espacios y precargarlas en el contenido.

**Out of scope (futuro):**

- El hero de `/fiberlux-app` (SPEC 59).
- Enlace editable del modo imagen (fijo a `/fiberlux-app`).
- Otros componentes que no sean `BannerApp`.
- Border-radius editable (valor fijo "ligero").

---

## Data model

Se agregan campos al grupo `banner` (colección `fiberluxApp`) en `tina/config.ts`. Los campos nativos actuales (`headingLead`, `headingStrong`, `pillText`, `bullets`, `downloadText`, `androidUrl`, `iosUrl`, `mockup`) se mantienen.

```
// nuevos campos del grupo "banner"
{ name: "mode", label: "Modo del banner", type: "string",
  options: [ {value:"nativa", label:"Nativa (editable)"}, {value:"imagen", label:"Imagen"} ] }
{ name: "imageMobile",  label: "Imagen mobile (≤600px)",  type: "image" }
{ name: "imageTablet",  label: "Imagen tablet (≤1024px)", type: "image" }
{ name: "imageDesktop", label: "Imagen desktop",          type: "image" }
{ name: "bgColor", label: "Color de fondo (modo imagen)", type: "string",
  ui: { component: "color" } }   // default "#0a0a0a"
```

**Renombrado de assets** (quitar espacios; mapeo por dimensiones):

```
"app fiberlux web-02.webp" (360×401)  → banner-app-img-mobile.webp   (mobile ≤600)
"app fiberlux web-01.webp" (600×625)  → banner-app-img-tablet.webp   (tablet ≤1024)
"app fiberlux web-03.webp" (1488×346) → banner-app-img-desktop.webp  (desktop)
```

**Contenido** (`src/content/fiberlux-app/index.json`, grupo `banner`):

```
mode: "imagen"
imageMobile:  "images/fiberlux-app/banner-app-img-mobile.webp"
imageTablet:  "images/fiberlux-app/banner-app-img-tablet.webp"
imageDesktop: "images/fiberlux-app/banner-app-img-desktop.webp"
bgColor: "#0a0a0a"
```

---

## Implementation plan

1. **Renombrar las 3 imágenes.**
   `git mv` de los 3 `.webp` con espacios a `banner-app-img-mobile/tablet/desktop.webp` en `public/images/fiberlux-app/`. Prueba manual: existen los 3 archivos con nombre limpio.

2. **Schema Tina.**
   En `tina/config.ts`, añadir al grupo `banner` los campos `mode`, `imageMobile`, `imageTablet`, `imageDesktop`, `bgColor` (según Data model). Prueba manual: en `/admin` aparecen el selector de modo, los 3 campos de imagen y el color.

3. **Render condicional en `BannerAppReact`.**
   Leer `mode`, las 3 imágenes y `bgColor`. Si `mode === "imagen"`: renderizar un `<a href="{BASE_URL}fiberlux-app">` que envuelve un `<picture>` con 3 `<source media>` (600/1024) e `<img>` fallback = mobile, con `w-full h-auto`, `rounded-2xl` y la sección con `background: bgColor`. Si no, el render nativo actual (sin cambios). Prueba manual: con `mode=imagen` se ve la imagen con esquinas redondeadas y enlaza a `/fiberlux-app`; con `mode=nativa`, el banner de siempre.

4. **Contenido.**
   En `src/content/fiberlux-app/index.json`, grupo `banner`: `mode: "imagen"`, las 3 rutas de imagen y `bgColor: "#0a0a0a"`. Prueba manual: home y nosotros muestran el banner en modo imagen.

---

## Acceptance criteria

- [ ] En `/admin`, el grupo Banner tiene un selector de modo (Nativa | Imagen), 3 campos de imagen y un color de fondo.
- [ ] Con `mode = nativa`, el banner se ve exactamente como hoy (titular, bullets, mockup, descarga).
- [ ] Con `mode = imagen`, el banner es solo la imagen, con border-radius ligero, sobre el color de fondo configurado.
- [ ] En modo imagen se muestra `banner-app-img-mobile` en ≤600px, `…tablet` en ≤1024px y `…desktop` en >1024px.
- [ ] En modo imagen, hacer clic en el banner lleva a `/fiberlux-app`.
- [ ] El color de fondo por defecto es `#0a0a0a` y se puede cambiar desde Tina.
- [ ] La imagen conserva su proporción (no se deforma ni recorta).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** un solo campo `mode` que conmuta entre el render nativo actual y el de imagen; no se borra nada del nativo.
- **Sí:** contenido arranca en `imagen` (pedido del cliente); el default del campo es `nativa` para no romper si alguien lo limpia.
- **Sí:** 3 imágenes **editables** (mobile/tablet/desktop), no hardcodeadas, para que el cliente pueda reemplazarlas.
- **Sí:** mapeo por **dimensiones** (mobile=360, tablet=600, desktop=1488), no por el número del archivo (que no coincide).
- **Sí:** enlace fijo a `/fiberlux-app` (no editable).
- **Sí:** `bgColor` default `#0a0a0a` (el negro actual), editable con color picker de Tina.
- **Sí:** alto proporcional (width 100%, height auto); border-radius `rounded-2xl` (≈16px, "ligero").
- **Sí:** renombrar los assets a slugs sin espacios (los espacios rompen/encodean mal en URLs).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Las imágenes portrait (mobile/tablet) se ven muy altas en su breakpoint | Alto proporcional respeta el diseño del asset; si molesta, se afina el breakpoint o el asset (no el layout). |
| `mode` vacío en contenido viejo deja el banner sin render | El componente trata cualquier valor ≠ `imagen` como `nativa` (fallback seguro). |
| Rutas con espacios si no se renombra | Paso 1 renombra a slugs limpios antes de referenciarlas. |

---

## Lo que **no** está en este spec

- El hero de `/fiberlux-app`.
- Enlace editable del modo imagen.
- Border-radius editable.
- Componentes distintos de `BannerApp`.

Cada uno, si aterriza, va en su propio spec.
