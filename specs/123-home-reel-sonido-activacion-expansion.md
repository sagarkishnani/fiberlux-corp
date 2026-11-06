# SPEC 123 — Home: reel con sonido, activación en pantalla y expansión sin máscara

> **Estado:** Aprobado
> **Depende de:** SPEC 117, SPEC 122
> **Fecha:** 2026-11-06
> **Objetivo:** Que el reel del Home arranque cuando ya se ve, crezca mostrando el cuadro completo del video (no como una ventana recortada), se pueda activar el sonido con un botón flotante y en mobile no ocupe toda la pantalla.

---

## Por qué existe este spec

Son 4 observaciones sobre el mismo componente (`src/components/home/HomeReelReact.tsx`), y las 4 cambian su mecánica de scroll:

| Obs | Origen | Pedido |
|---|---|---|
| 66 | PDF 1 | Activador de volumen flotante, para no ver todo el video en mute. |
| 69 | PDF 4 | Que el video se active cuando el scroll ya lo está mostrando. |
| 70 | PDF 5 | Que la expansión no sea una máscara: el video debe agrandarse hasta ocupar la pantalla, y debe poder verse bien si el usuario se queda a mitad de scroll. |
| 87 | Mobile 1 | En mobile que no ocupe todo el espacio (quizás 1:1), que se vea más del video, y con el mismo botón de sonido. |

Estado actual (staging):

- El loop (`reel-1080/720.{webm,mp4}`, 20 s) es el **inicio** del video completo y **no tiene pista de audio** (ffprobe: solo video). El completo (`fiberlux-corp-full-{1080,720}.mp4`, 91.7 s) sí tiene audio.
- Expansión: `clip-path: inset()` sobre una card `absolute inset-0` con `object-cover`. Desktop arranca en `inset(6% 28% 42% 28%)` y mobile en `inset(24% 16px 24% 16px)`; los dos terminan en pantalla completa. Por eso a mitad de scroll se ve una **ventana recortada** del cuadro, y en mobile el final es un 16:9 recortado a vertical, que corta la cara.
- Play: arranca apenas una parte de la sección es visible (IntersectionObserver), antes de que la ventana se vea.

---

## Scope

**Incluye:**

- **Expansión por escala (70).** La card tiene la proporción real del video (16:9 en desktop) y crece con `transform: scale()` desde un tamaño inicial hasta su tamaño final. El cuadro completo se ve en todo momento, sin recorte.
  - Desktop: final = pantalla completa (`object-cover` solo en el estado final, sin `clip-path`).
  - Mobile (`< 1024px`): final = card **1:1** de `100vw − 32px`, centrada en el sticky. Inicio en 0.7× de ese tamaño. Se elimina el final a pantalla completa en mobile.
- **Activación en pantalla (69).** El loop arranca recién cuando la card visible tiene ≥ 50% de su área dentro del viewport. La primera vez arranca desde `currentTime = 0`. Se pausa al bajar de ese umbral (como hoy al salir).
- **Botón de sonido flotante (66, 87).** Una pastilla redonda abajo a la derecha de la card (dentro del sticky, así acompaña mientras la sección está pinneada), con ícono de parlante tachado o activo.
  - Al activar el sonido, el `<video>` cambia la fuente al video completo (720 en mobile, 1080 en desktop) en el **mismo `currentTime`** y sigue con audio. Así la narración no se corta a los 20 s.
  - Al desactivarlo, se silencia sin cambiar de fuente.
  - Al terminar el video completo, vuelve al loop silenciado.
  - Al salir de la sección se pausa. Al volver, sigue donde quedó y con el último estado de sonido.
  - Abrir "Ver video completo" (modal) pausa el inline, igual que hoy.
- Textos del botón (`aria-label`): "Activar sonido" / "Silenciar" en `src/i18n/ui.ts` (`reel.soundOn`, `reel.soundOff`, con EN).
- `prefers-reduced-motion`: sin escala animada (la card queda en su tamaño final) y sin autoplay; el botón de sonido arranca la reproducción.

**Fuera de scope:**

- Cambiar el modal "Ver video completo" (`VideoModal.tsx`). El título "Fiberlux" va en SPEC 122 (obs 67).
- Subir el video a YouTube.
- Re-encodear el loop con audio.
- Cambiar el marquee de texto que pasa detrás de la card.
- Hacer editable desde el CMS el tamaño inicial/final de la card.

---

## Modelo de datos

Este spec no cambia el schema de Tina. Reusa `home.reel` (`loop*`, `fullVideoMp41080`, `fullVideoMp4720`, `poster`).

Estado interno del componente:

```ts
type ReelState = {
  started: boolean;      // ya arrancó al menos una vez (para el currentTime = 0 inicial)
  sound: boolean;        // el usuario activó el sonido
  source: "loop" | "full";
};
```

Constantes nuevas en `HomeReelReact.tsx`:

```ts
const PLAY_VISIBLE_RATIO = 0.5;  // área visible de la card para arrancar
const MOBILE_START_SCALE = 0.7;  // tamaño inicial de la card 1:1 en mobile
```

- Si `fullVideoMp4*` está vacío, el botón de sonido **no se pinta** (el loop no tiene audio).

---

## Plan de implementación

Rama: `spec-123-home-reel-sonido-expansion` contra `staging`.

1. **Card con proporción real y escala.** Reemplazar el `clip-path` por una card de `aspect-ratio: 16/9` escalada con `transform`, interpolando de la escala inicial a la que cubre el viewport. Verificación: a 1512×900, al 50% del scroll se ve el cuadro completo (sin recorte) y al 100% cubre la pantalla.
2. **Mobile 1:1.** En `< 1024px` la card es cuadrada (`100vw − 32px`) y escala de 0.7 a 1. Verificación: a 390×844, en el estado final la card mide 358×358 y no llega a los bordes verticales.
3. **Activación por visibilidad.** Calcular el área visible de la card en el mismo frame de scroll y arrancar o pausar con el umbral de 50%. Verificación: a 1512×900 el video sigue en `paused` mientras solo asoma el borde, y arranca desde 0 cuando la card está a la mitad dentro.
4. **Botón de sonido.** Pastilla flotante con cambio de fuente al completo en el mismo `currentTime`, silencio y vuelta al loop al terminar. Verificación: activar a los 8 s → suena desde 8 s; pasa los 20 s sin cortarse; al terminar el completo vuelve al loop mudo.
5. **Interacción con el modal y la salida.** Pausar al abrir el modal o salir de la sección, y retomar con el mismo estado. Verificación: Playwright en desktop y mobile.
6. **Reduced motion e i18n.** Card estática y sin autoplay; `aria-label` ES/EN. Verificación: emular `prefers-reduced-motion` y `/en`.
7. **Registro.** obs 66, 69, 70 y 87 → `Hecho` en `specs/observaciones-cliente.md`. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] En ningún punto del scroll el video del reel se ve recortado por un `clip-path` (desktop y mobile).
- [ ] A 1512×900 el reel termina cubriendo la pantalla completa.
- [ ] A 390×844 el reel termina como una card 1:1 de 358px de lado, con aire arriba y abajo.
- [ ] El loop no arranca hasta que al menos el 50% de la card es visible, y la primera vez arranca desde el segundo 0.
- [ ] Hay un botón flotante de sonido sobre la card en desktop y mobile, con `aria-label` en ES y EN.
- [ ] Al activar el sonido se escucha el audio desde el mismo segundo y el video pasa de los 20 s sin cortarse.
- [ ] Al silenciar, el video sigue sin audio y sin saltos.
- [ ] Al abrir "Ver video completo" el inline se pausa y no suenan dos audios a la vez.
- [ ] Si `fullVideoMp41080` y `fullVideoMp4720` están vacíos, no aparece el botón de sonido.
- [ ] Con `prefers-reduced-motion` la card no escala y el video no arranca solo.
- [ ] El video completo solo se descarga después de tocar el botón de sonido (sin requests al cargar la página).
- [ ] `npm run build` en verde y sin scroll horizontal a 390px.

---

## Decisiones

- **Sí:** escalar una card con la proporción real en vez de recortar con `clip-path`. Es lo que pide el cliente ("que el video se agrande") y deja ver el cuadro completo a mitad de scroll.
- **No:** mantener `clip-path` y solo cambiar los insets. Seguiría siendo una ventana recortada.
- **Sí:** al activar el sonido, cambiar al video completo en el mismo segundo. El loop no tiene audio y es el inicio del completo, así que el corte no se nota.
- **No:** re-encodear el loop con audio. La narración se cortaría a los 20 s y volvería a empezar en cada vuelta.
- **No:** abrir el modal al activar el sonido. El cliente quiere un activador flotante sobre el mismo video.
- **Sí:** en mobile, final 1:1 y no pantalla completa. El 16:9 recortado a vertical corta a la persona (captura mobile 1).
- **Sí:** umbral del 50% del área visible para arrancar. Cumple "cuando ya se ve" sin esperar a que la card esté entera.
- **Sí:** el estado de sonido se mantiene al salir y volver a la sección (en la misma visita). No se persiste entre visitas.
- **Sí:** definición consolidada sin ronda de preguntas propia: lo resolvieron la observación del cliente y el análisis del código.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Safari iOS no deja cambiar de fuente con audio sin un gesto nuevo | El cambio ocurre dentro del `click` del botón (es un gesto). Probar en iOS real; si falla, el botón abre el modal como plan B. |
| El salto loop → completo muestra un frame negro | Precargar el completo con `preload="auto"` en un `<video>` oculto al tocar el botón, y cambiar al tener `canplay`, con el poster del frame actual de fondo. |
| La escala de un video 1080 en cada frame baja el rendimiento en equipos débiles | Solo `transform` (capa de composición) con `will-change: transform` mientras la sección está pinneada. Medir frames con Playwright como en obs 38–41. |
| El 1:1 en mobile recorta los costados del 16:9 | Es un recorte menor que el vertical actual. Si se corta a la persona, se ajusta `object-position`. |

---

## Qué **no** entra en este spec

- Cambios al modal "Ver video completo".
- Re-encodear el loop o subir el video a YouTube.
- Edición desde el CMS de los tamaños de la card.
