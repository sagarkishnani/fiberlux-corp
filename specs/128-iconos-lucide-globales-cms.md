# SPEC 128 — Íconos Lucide en todo el sitio: selector con buscador en Tina

> **Estado:** Borrador
> **Depende de:** SPEC 117–120
> **Fecha:** 2026-11-06
> **Objetivo:** Que todos los campos de ícono del CMS permitan elegir cualquier ícono de Lucide con un selector con buscador, sin cambiar los íconos ya cargados ni inflar el JavaScript del sitio.

---

## Por qué existe este spec

**Obs 96** (WhatsApp, captura del campo "Ícono" de Info Abonados): "¿Hay forma de que haya un listado más amplio de íconos? En general para toda la web. Podríamos usar el repo de Lucide, que me parece más completo."

Estado actual (staging):

- `tina/config.ts` tiene **14 campos `icon`** (aprox. L454, 719, 759, 1172, 1651, 1778, 1811, 1922, 2015, 2183, 3469, 4219, 4460, 4503). Cada uno es un `select` con su propia lista cerrada; el de la captura (L3469) tiene 6 opciones.
- Cada componente traduce esa clave a un glifo con su propio mapa (Font Awesome 6 de `react-icons/fa6`, SVG propios como `servicios/cyberguardIcons.tsx`, Lucide vía `react-icons/lu` en el popup).
- Lucide tiene unos 1.500 íconos. Importarlos todos en un island multiplicaría el JS del sitio.

---

## Scope

**Incluye:**

- **Campo reutilizable `iconField()`** en `tina/fields/iconField.tsx`: campo `string` con `ui.component` propio.
  - Buscador por nombre (ES/EN: alias en español para los más comunes, p. ej. "escudo" → `shield`), grilla con vista previa, ícono elegido arriba y botón "Quitar".
  - Guarda el nombre kebab de Lucide (`"file-text"`, `"shield-check"`).
  - El catálogo completo de Lucide se carga **solo en el admin** (`/admin`), no en el sitio.
- **Los 14 campos `icon`** pasan a usar `iconField()`.
- **Compatibilidad con lo cargado.** Los valores actuales (`"certificate"`, `"shield"`, `"laptop"`…) siguen viéndose **exactamente igual**: cada componente conserva su mapa legacy, y solo si el valor no está en él se resuelve como Lucide.
  - Al desplegar, ningún ícono visible cambia.
  - El cliente cambia los que quiera desde Tina.
- **Resolver único `src/components/shared/Icon.tsx`:** `<Icon name legacy={MAPA} />`.
  1. Si `name` está en el mapa legacy del componente, pinta ese glifo.
  2. Si está en el mapa generado de íconos usados, pinta ese ícono de Lucide (SSR, sin parpadeo).
  3. Si no, carga el ícono de Lucide bajo demanda (caso de vista previa en vivo en Tina con un ícono recién elegido).
  4. Si el nombre no existe, pinta un ícono neutro (`circle`) y avisa con `console.warn` en dev.
- **Mapa de íconos usados (build):** script `scripts/gen-used-icons.mjs` (en `prebuild` y `predev`) que recorre `src/content/**` y genera `src/icons/used-icons.generated.ts`, importando solo esos íconos de `react-icons/lu` (tree-shaking).
- Estilo: los íconos Lucide heredan tamaño y color del contenedor (`currentColor`, `strokeWidth` 1.75), como los outline actuales.

**Fuera de scope:**

- Reemplazar en bloque los íconos actuales por equivalentes Lucide.
- Íconos hardcodeados en código que no vienen del CMS (header, footer, flechas, redes sociales).
- Subir SVG propios desde Tina.
- Cambiar el set de `react-icons/fa6` usado fuera del CMS.

---

## Modelo de datos

Los campos siguen siendo `string`; cambia solo el control del editor.

```ts
// tina/fields/iconField.tsx
export function iconField(opts: { name?: string; label?: string; legacy?: string[] } = {}) {
  return {
    name: opts.name ?? "icon",
    label: opts.label ?? "Ícono",
    type: "string" as const,
    ui: { component: IconPicker }, // `legacy` se muestra como "íconos actuales" al tope del picker
  };
}
```

```ts
// src/icons/used-icons.generated.ts (generado, no se edita)
import { LuFileText, LuShieldCheck } from "react-icons/lu";
export const USED_ICONS = { "file-text": LuFileText, "shield-check": LuShieldCheck } as const;
```

Valores guardados:

```jsonc
{ "icon": "certificate" }   // legacy: se sigue pintando con el mapa del componente
{ "icon": "file-badge" }    // nuevo: Lucide
```

- Nombres de Lucide en kebab-case, tal como aparecen en lucide.dev.
- `react-icons/lu` exporta en PascalCase con prefijo `Lu` (`file-badge` → `LuFileBadge`). El script y el picker usan la misma conversión.

---

## Plan de implementación

Rama: `spec-128-iconos-lucide-cms` contra `staging`.

1. **Inventario.** Listar los 14 campos (colección, ruta, componente, mapa legacy) en una tabla dentro del tracker. Verificación: cada campo tiene identificado su componente.
2. **Resolver `Icon.tsx` + script de íconos usados.** Sin tocar el schema todavía. Verificación: `npm run build`; el tamaño del JS de los islands no crece más de 5 KB gzip.
3. **Picker en Tina.** `iconField()` con buscador y vista previa, aplicado primero al campo de Info Abonados (L3469). Verificación: en `/admin`, elegir `file-badge` y ver el ícono en la vista previa en vivo y tras rebuild.
4. **Migrar los 13 campos restantes**, en commits por colección, cambiando cada componente a `<Icon name legacy={...} />`. Verificación: capturas antes y después de Home, Nosotros, Cyberguard, Soporte, Info Abonados y el popup, sin diferencias.
5. **Registro.** obs 96 → `Hecho` en `specs/observaciones-cliente.md`, con nota para el cliente sobre cómo buscar íconos. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] Los 14 campos de ícono del CMS abren un selector con buscador sobre todo Lucide.
- [ ] Buscar "escudo" o "shield" muestra los íconos de escudo.
- [ ] Al desplegar sin tocar contenido, ningún ícono visible del sitio cambia (capturas de comparación).
- [ ] Un ícono Lucide elegido en Tina se ve en la vista previa en vivo y en el sitio tras el build.
- [ ] El HTML generado incluye el SVG de los íconos Lucide usados (no aparecen recién al hidratar).
- [ ] El JS de los islands del sitio no crece más de 5 KB gzip respecto de `staging`.
- [ ] Un nombre inexistente pinta un ícono neutro y no rompe la página.
- [ ] `npm run build` en verde.

---

## Decisiones

- **Sí:** selector con buscador sobre todo Lucide, en los 14 campos. Era la opción recomendada; el autor no eligió otra. El cliente pidió un listado amplio "para toda la web".
- **No:** solo ampliar cada lista cerrada. Seguiría limitado y habría que mantener 14 listas.
- **Sí:** `react-icons/lu`, que ya es dependencia. No suma paquetes; `lucide-react` duplicaría el set.
- **Sí:** conservar los mapas legacy. Varios íconos actuales son SVG propios (Cyberguard) o Font Awesome; cambiarlos en bloque alteraría el diseño aprobado.
- **Sí:** mapa generado de íconos usados para el SSR + carga bajo demanda solo para la vista previa. Evita meter los 1.500 íconos en el bundle sin perder la edición en vivo.
- **No:** importar todo `react-icons/lu` en el sitio. Infla el JS de cada island que muestre un ícono.
- **No:** subir SVG propios desde el CMS. Es otro problema (sanitizar, estilos) y el cliente pidió Lucide.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La carga dinámica de un ícono de `react-icons/lu` arrastra todo el paquete (no es por ícono) | Paso 2 lo mide. Si arrastra todo, la carga bajo demanda queda **solo en el admin** (Tina) y el sitio usa solo el mapa generado (el ícono nuevo aparece tras el build). |
| El picker hace lento al admin | Grilla virtualizada o paginada (100 íconos visibles) con búsqueda en memoria. |
| Versiones distintas de Lucide entre el picker y `react-icons` | El picker toma la lista de nombres desde `react-icons/lu`, la misma fuente que el sitio. |
| Un componente usa la clave del ícono para algo más que el glifo (color, layout) | El inventario del paso 1 lo detecta; esos casos conservan su lógica sobre las claves legacy. |

---

## Qué **no** entra en este spec

- Reemplazar en bloque los íconos actuales.
- Íconos hardcodeados fuera del CMS.
- Subida de SVG propios.
