# SPEC 119 — Rediseño 3: Categorías, Soluciones y Ciberseguridad

> **Estado:** Aprobado
> **Depende de:** SPEC 109 (portafolio 5 categorías / 30 soluciones), SPEC 117 (fundaciones), SPEC 118 (bloques compartidos testimonios/CTA)
> **Fecha:** 2026-11-01
> **Objetivo:** Rehacer las 4 páginas de categoría genérica, las 30 páginas de solución y la página especial de Ciberseguridad (5 categorías en total, SPEC 109) con el diseño claro del prototipo.

---

## Por qué existe este spec

Es la tercera parte del rediseño (ver SPEC 117). Es el bloque con más páginas generadas (5 categorías + 30 subservicios, según el SPEC 109) y con una plantilla nueva: **Ciberseguridad** deja de usar la plantilla genérica de categoría y pasa a tener su propia página, con planes Cyberguard y formulario.

Referencia: `references/rediseno/` (desktop y mobile de cada una):

- `Categoria.dc.html`
- `Solucion.dc.html`
- `Ciberseguridad.dc.html`

---

## Scope

**In:**

- **Categoría** (`/soluciones/[categoria]`, para Conectividad, Data Center, Infraestructura y Comunicaciones Unificadas):
  1. Hero de categoría.
  2. Marquee.
  3. Desafío, solución e industrias.
  4. Catálogo de soluciones.
  5. Partners.
  6. Artículos relacionados.
  7. Formulario (reusa `DynamicFormReact` con el form `servicios`).
- **Solución** (`/soluciones/[categoria]/[subservicio]`, 30 páginas):
  1. Hero.
  2. Beneficios.
  3. Casos de uso.
  4. Testimonios.
  5. Otras soluciones.
- **Ciberseguridad** (plantilla propia), en el orden del prototipo:
  1. Hero.
  2. Seis frentes.
  3. La protección crece.
  4. Planes Cyberguard.
  5. Qué cambia.
  6. Por qué Cyberguard.
  7. Beneficio por área.
  8. Cómo empezamos.
  9. Preguntas frecuentes.
  10. CTA.
  11. Formulario.
- Imágenes de categoría del prototipo (`cat-hero-*`, `cat-desafio-*`, `cat-industria-*`) en `public/images/rediseno/`, editables desde Tina.
- Campos nuevos con `_en` en `service` y `subservicio` para lo que no existe hoy. La página de Ciberseguridad tiene sus campos propios (ver Data model).
- Limpieza de los componentes oscuros de soluciones sin uso, y rutas `/en`.

**Fuera de scope (para specs posteriores):**

- Lógica nueva de formularios: se reusan los forms CMS existentes.
- Contratación o pago en línea de los planes Cyberguard (solo es informativo + CTA/formulario).
- Respuestas FAQ de subservicios que hoy están vacías (contenido del cliente).

---

## Data model

Se reutilizan las colecciones `service` y `subservicio`. Para Ciberseguridad se agrega un **bloque opcional `cyberguard`** dentro del documento `service` de ciberseguridad:

```ts
cyberguard?: {
  frentes:     { title, items: [{ icon, title, text }] },      // seis frentes
  crecimiento: { title, text },
  planes:      { title, items: [{ name, price?, features: [string], cta: { label, href }, highlighted: boolean }] },
  queCambia:   { title, items: [{ before, after }] },
  porQue:      { title, items: [{ title, text }] },
  porArea:     { title, items: [{ area, benefit }] },
  pasos:       { title, items: [{ step, title, text }] },
  faq:         { title, items: [{ question, answer }] },
}
```

Todos los strings tienen su `_en`. Si `cyberguard` existe, la ruta de esa categoría usa la plantilla Ciberseguridad; si no, la genérica. Los nombres exactos se ajustan al prototipo en el paso 1.

---

## Implementation plan

1. Rama `spec-119-rediseno-soluciones` desde `staging`. Mapear el prototipo contra `service` y `subservicio` y listar los faltantes.
2. Schema (`cyberguard` + campos faltantes con `_en`) y contenido ES/EN. Build verde.
3. Plantilla Categoría (hero → catálogo).
4. Categoría: partners, artículos relacionados y formulario.
5. Plantilla Solución (las 30 páginas comparten componente).
6. Plantilla Ciberseguridad: hero → planes.
7. Ciberseguridad: qué cambia → formulario.
8. Mega-menú del header (SPEC 117): verificar que enlaza Ciberseguridad a su plantilla nueva.
9. Reveals, `prefers-reduced-motion`, limpieza de componentes sin uso y wrappers `/en`. Actualizar `CLAUDE.md`.

---

## Acceptance criteria

- [ ] `npm run build` genera las 4 categorías genéricas, las 30 soluciones y Ciberseguridad, en ES y `/en`.
- [ ] En 1440px y 390px, Categoría, Solución y Ciberseguridad coinciden con sus prototipos desktop y mobile.
- [ ] Ciberseguridad usa su plantilla propia; las otras 4 categorías usan la genérica.
- [ ] Los planes Cyberguard, la FAQ y los pasos son editables en `/admin`.
- [ ] El formulario de Categoría y el de Ciberseguridad envían a `send-email.php` igual que hoy (lead recibido).
- [ ] El índice de búsqueda (SPEC 81) sigue apuntando a URLs válidas.
- [ ] La consola del navegador queda sin errores en una categoría, una solución y Ciberseguridad, ES y EN.

---

## Decisiones

- **Sí:** Ciberseguridad con plantilla propia activada por la presencia del bloque `cyberguard`. Evita una ruta hardcodeada.
- **No:** colección nueva para Cyberguard. Es un único documento y vive mejor dentro de su `service`.
- **Sí:** reusar los forms CMS (`servicios`) en vez de crear uno nuevo.
- **Sí (asumido):** fidelidad 1:1 y reutilización del contenido de Tina.
- **Definición rápida:** el autor pidió asumir y guardar.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| 30 subservicios con contenido desigual (campos vacíos) | Cada sección se oculta si su dato está vacío; nunca se renderiza una caja vacía. |
| Precios de los planes Cyberguard cambian seguido | `price` es opcional y editable; sin precio se muestra solo el CTA. |

---

## Lo que **no** entra en este spec

- Pago o contratación en línea.
- Páginas de servicio y legales (SPEC 120).
