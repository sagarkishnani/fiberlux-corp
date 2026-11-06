# SPEC 126 — Sello ISO animado (estampado estilo Nextnet) en Certificaciones

> **Estado:** Aprobado
> **Depende de:** SPEC 117, SPEC 118
> **Fecha:** 2026-11-06
> **Objetivo:** Reemplazar el sello CSS de la sección de Certificaciones por el sello SVG que se "estampa" al entrar en pantalla, portado de `nextnet.pe` y con los colores de Fiberlux.

---

## Por qué existe este spec

**Obs 84** (PDF 19, "Confirmar"): "¿El ISO (certificación) podría tener la animación de aquí?". El autor confirmó que la referencia es el efecto de **nextnet.pe**.

En el proyecto hermano `~/Documents/Proyectos/Twinstudios/Fiberlux/Web/nextnet` ese efecto vive en `src/components/home/ComplianceReact.tsx` (función `Sello`), documentado en su SPEC 06 (`specs/06-certificaciones-home-sello-iso.md`). Mecánica:

- Anillo exterior que se dibuja con `pathLength`.
- 12 ticks radiales que aparecen en secuencia.
- Halo que se enciende y se apaga, como un estampado.
- Al terminar el estampado: anillo punteado y texto curvo (`textPath`) en rotación lenta y perpetua (CSS `nx-sello-gira`), en sentidos opuestos.
- Código central (p. ej. `27001`) y bajada.
- Se estampa una sola vez al entrar en pantalla (`useInView`).

En Fiberlux la sección es `src/components/shared/CertificacionesV2.tsx` (125 líneas), usada en Home (`HomeCertificacionesReact`), Nosotros y `/soluciones`. Hoy es un sello CSS: anillo punteado que gira, anillos internos, "ISO" y el código.

El contenido ya trae `ringText` / `ringText_en` ("CERTIFICACIÓN ISO 27001 · SEGURIDAD DE LA INFORMACIÓN"), que hoy **no se usa** y es justo lo que necesita el texto curvo.

---

## Scope

**Incluye:**

- Nuevo `src/components/shared/fx/IsoSeal.tsx`: port del `Sello` de Nextnet.
  - Misma geometría (viewBox 240, `RING_R = 84`, 12 ticks entre r=104 y r=110), mismas fases y easings.
  - Paleta Fiberlux sobre el fondo actual de la card: trazo y ticks `#96237A` → `#E9A7DC`, halo magenta, código en blanco (si la card es oscura) o `fx-ink` (si es clara). Space Mono en el texto curvo (ya está en el proyecto).
  - Texto curvo = `ringText` (con `tField` para EN), repetido con ` · ` hasta cerrar la vuelta, como `useRingLoop`.
  - Bajada = `label` (hoy tampoco se usa en el sello).
- `CertificacionesV2.tsx` usa `IsoSeal` en lugar del sello CSS, en las 3 páginas.
- Con 2 o más certificaciones se mantiene la rotación automática cada 5 s. Cada vez que entra una, se re-estampa.
- Estampado una sola vez por entrada en pantalla (`useInView` con `once`), con `motion/react` (ya instalado, `motion@^12`).
- El texto curvo se oculta bajo `md`, como en Nextnet (no se lee a tamaño chico). Ticks, anillo y código se mantienen.
- `prefers-reduced-motion`: sello estático completo, sin trazo, sin giro y sin halo.
- Keyframes `fx-seal-spin` en `src/styles/fx.css`. Es el equivalente de `nx-sello-gira`; se renombra por el prefijo del proyecto.

**Fuera de scope:**

- La inclinación del panel al puntero (tilt) de Nextnet.
- El resto del rediseño de la sección de Nextnet (compromisos, barrido de luz, hairline, columnas).
- Cambiar textos o la cantidad de certificaciones.
- Agregar ISO 9001 u otras normas (es contenido).

---

## Modelo de datos

Este spec no cambia el schema de Tina. Reusa la colección `certificaciones` (`src/content/certificaciones/index.json`):

```ts
type Cert = {
  code: string;          // "27001" → centro del sello
  label?: string;        // "SEGURIDAD DE LA INFORMACIÓN" → bajada del código
  label_en?: string;
  ringText?: string;     // texto curvo; vacío ⇒ no se pinta el texto curvo
  ringText_en?: string;
  norm?: string;         // se sigue mostrando fuera del sello, como hoy
  norm_en?: string;
};
```

Props del componente nuevo:

```ts
type IsoSealProps = {
  cert: Cert;
  locale: "es" | "en";
  go: boolean;           // true cuando entra en pantalla
  tone: "dark" | "light";
};
```

---

## Plan de implementación

Rama: `spec-126-sello-iso-animado` contra `staging`.

1. **Port del sello.** Copiar `Sello` y sus constantes de Nextnet a `IsoSeal.tsx`, adaptar tipos, textos (`tField`) y paleta. Verificación: montado aislado en Home reemplazando el sello actual, el estampado corre y luego gira.
2. **Keyframes y reduced motion.** `fx-seal-spin` en `fx.css` y la rama estática. Verificación: con reduced motion emulado, el sello se ve completo y quieto.
3. **Integración en `CertificacionesV2`.** Sustituir el sello CSS y re-estampar en la rotación automática. Verificación: Home, Nosotros y `/soluciones` a 1512 y 390px.
4. **Rendimiento.** Medir frames con Playwright mientras gira (como obs 38–41). Verificación: mediana ≤ 16.7 ms a 390px con CPU ×4.
5. **Registro.** obs 84 → `Hecho` en `specs/observaciones-cliente.md`. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] Al entrar la sección en pantalla, el anillo del sello se dibuja, aparecen los ticks en secuencia y se enciende y apaga un halo.
- [ ] Después del estampado, el anillo punteado y el texto curvo giran lento en sentidos opuestos.
- [ ] El texto curvo dice el `ringText` de la certificación (ES) y el `ringText_en` en `/en`.
- [ ] El centro muestra el código (`27001`) y su `label`.
- [ ] El estampado no se repite al hacer scroll arriba y abajo sin salir de la página.
- [ ] Bajo 768px no se pinta el texto curvo y el sello no desborda la card.
- [ ] Con `prefers-reduced-motion` el sello es estático y completo.
- [ ] El sello nuevo aparece en Home, Nosotros y `/soluciones`.
- [ ] `npm run build` en verde.

---

## Decisiones

- **Sí:** portar el `Sello` de Nextnet en vez de recrearlo a ojo. El autor y el cliente lo pidieron como referencia directa, y el cliente quiere réplicas fieles.
- **Sí:** usar `ringText` y `label`, que ya existen en el contenido y no se usaban. No hace falta schema nuevo.
- **No:** portar el tilt al puntero ni el resto de la sección de Nextnet. El pedido es la animación del sello.
- **Sí:** `motion/react`, ya en el proyecto. No suma dependencias.
- **Sí:** renombrar el keyframe con el prefijo `fx-` del proyecto, para no mezclar el `nx-` de Nextnet.
- **Sí:** definición consolidada sin ronda de preguntas propia: la referencia es código existente y documentado.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La paleta de Nextnet (verde) no luce igual en morado sobre la card actual | Ajustar tonos en el QA. Las referencias del PDF (pág. 12) muestran el sello morado sobre fondo oscuro. |
| Re-estampar en cada rotación automática distrae | Con una sola certificación (caso actual) no aplica. Con 2 o más, se re-estampa solo el trazo, sin halo. |
| El `textPath` con `useId` duplica ids si hay 2 secciones en la misma página | `useId` por instancia, como en Nextnet. |

---

## Qué **no** entra en este spec

- Tilt al puntero.
- Rediseño completo de la sección de Certificaciones.
- Nuevas certificaciones o cambios de texto.
