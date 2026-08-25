# SPEC 105 — Beneficios de subservicio: ilustraciones SVG animadas por plantilla

> **Estado:** Aprobado
> **Depende de:** SPEC 12 (plantilla de subservicio nivel 2, sección `beneficios`), SPEC 71 (sistema `data-reveal` de animaciones de entrada), SPEC 80 (i18n `_en`/`tField`)
> **Fecha:** 2026-08-25
> **Objetivo:** Portar desde el proyecto nexnet las 14 plantillas de ilustración SVG animada al pie de cada card de "Beneficios" de subservicio, repintadas en morado sobre fondo oscuro y asignadas a las 112 cards existentes sin tocar sus textos.

---

## Sección 1 — Por qué existe este spec

Hoy la card de beneficio es un chip de ícono `react-icons` sobre título y texto: el mismo glifo genérico se repite en decenas de subservicios (`escudo` aparece 23 veces, `red` 19), así que la sección no comunica nada específico del servicio que la contiene. La referencia que trajo el cliente ([nexnet, internet corporativo](https://staging.dkqxgw0nph0me.amplifyapp.com/soluciones/conectividad/internet-corporativo/)) resuelve eso con una ilustración animada al pie de cada card, dibujada por código a partir de una plantilla que el editor elige en Tina y alimenta con sus propios datos.

Ese sistema ya existe, escrito y probado, en `/Users/sagarkishnanigarcia/Documents/Proyectos/Twinstudios/Fiberlux/Web/nextnet` (`src/components/soluciones/beneficios/`): 14 plantillas SVG, un registro, helpers compartidos y sus keyframes. Este spec lo trae a Fiberlux **como código de referencia, no como copia visual**: la paleta verde sobre fondo claro de nexnet se reescribe a morado de marca sobre el `greyscale-darkest` que la sección ya usa.

Los 35 subservicios de nexnet comparten slug con los de Fiberlux (con ocho variaciones de nombre, ver Sección 3), así que su asignación de plantillas sirve de guía de partida — pero la asignación final se decide por el texto de cada card de Fiberlux, que es distinto y en algunos casos tiene otro número de cards.

---

## Sección 2 — Alcance

**Dentro:**

- **Portar las 14 plantillas** a `src/components/servicios/beneficios/`: `velocidad`, `simetria`, `gauge`, `sedes`, `dwdm`, `uptime`, `prioridad`, `conmutacion`, `mfa`, `escudo`, `reloj`, `checklist`, `escalera`, `consola`. Cada una es un SVG `320×180` autocontenido que se anima una sola vez al entrar en viewport, más los bucles suaves que ya trae.
- **Portar el andamiaje**: `base.tsx` (lienzo común, helpers `pct` / `ret` / `anchoTexto` / `cajaEtiquetas` / `useTurno` y la paleta `C`) y el registro `IlustracionBeneficio.tsx` que mapea el valor de Tina al componente.
- **Repintar la paleta a Fiberlux**: `C` pasa a acento `#96237A` (brand-purple), claro `#c65fac`, apagados en blanco a baja opacidad y textos en `rgba(255,255,255,.75)`. La sección **no cambia de fondo**: sigue en `greyscale-darkest`.
- **Portar los keyframes** `nx-ben-*` de nexnet con prefijo propio (`fbx-ben-*`), incluido su bloque `prefers-reduced-motion`. Van en el `<style>` del componente, no en `global.css` (que en este repo no se empaqueta).
- **Rehacer la card** en `BeneficiosReact.tsx`: fuera el chip de ícono, dentro la ilustración al pie empujada con `mt-auto` para que las cards de una fila la alineen aunque sus textos midan distinto. Se conservan el borde `white/10`, el fondo `white/[0.03]`, el glow radial morado en hover y el `-translate-y-1`.
- **Grid de 6 columnas** con cards a `md:col-span-2` y `md:auto-rows-fr`, para que los 6 subservicios que tienen 4 cards centren su última fila en vez de dejarla pegada a la izquierda.
- **Schema Tina** (colección `subservicio` → `beneficios.items[]`): se **elimina** el campo `icon` y su lista de opciones; se añaden `plantilla` (selector de las 14), `datos` (objeto plano con todos los campos opcionales de todas las plantillas, cada uno documentado con la plantilla a la que pertenece) e `image` (imagen opcional que manda sobre la ilustración).
- **i18n de las etiquetas del SVG**: cada etiqueta de `datos` gana su sibling `_en` (`etiqueta_en`, `unidad_en`, `filas[].label_en`, `rutas[].label_en`, `nodos[].label_en`, `chips[].label_en`) y se lee con `tField`. Se dejan vacíos: fallback ES, el cliente los rellena en Tina.
- **Asignar plantilla y datos a las 112 cards** de los 35 JSON de `src/content/subservicios/`, y **borrar el `icon`** de cada una. Los textos `title` / `text` y sus `_en` **no se tocan**.
- **Accesibilidad**: la ilustración es decorativa (`aria-hidden`), no entra en el orden de foco, y con `prefers-reduced-motion` se queda en su fotograma final sin animar.

**Fuera de alcance (para futuros specs):**

- La sección de beneficios de la app (`src/components/fiberlux-app/BeneficiosAppReact.tsx`): es otra colección y otro diseño, se queda como está.
- Traducir al inglés el contenido de las etiquetas nuevas: el schema lo soporta, los valores quedan en fallback ES.
- Plantillas nuevas más allá de las 14 portadas. Si una card no calza en ninguna, se resuelve con el campo `image`.
- Editabilidad en Tina de colores, tiempos o densidad de las ilustraciones: quedan horneados en `base.tsx` y en las constantes de cada plantilla.
- Tocar el hero, "Casos de uso", FAQ o cualquier otro bloque de la plantilla de subservicio.
- Portar de nexnet cualquier otra sección (catálogo, hero con marquee, motivos de valor).

---

## Sección 3 — Modelo de datos

### 3.1 Schema Tina — `subservicio` → `beneficios.items[]`

Se **quita** `icon` (y el bloque `options` de 12 valores que lo acompaña). Los campos `title`, `title_en`, `text`, `text_en` quedan **intactos**. Se añaden:

```js
{ name: "plantilla", label: "Ilustración", type: "string",
  options: PLANTILLA_BENEFICIO_OPTIONS,   // las 14, con etiqueta descriptiva
  description: "Vacío = card sin ilustración, sólo título y texto." },
datosIlustracionField(),                   // ver 3.2
{ name: "image", label: "Gráfico ilustrativo", type: "image",
  description: "Opcional. Si la subes, manda sobre la ilustración." }
```

`PLANTILLA_BENEFICIO_OPTIONS` (constante en `tina/config.ts`, misma redacción que en nexnet):

| valor | etiqueta en el panel |
| --- | --- |
| `velocidad` | Velocidad — tarjetas apiladas con anillo |
| `simetria` | Simetría — curva de área con flechas |
| `gauge` | Prioridad — semicírculo de rayitas |
| `sedes` | Sedes — nodos unidos en una LAN |
| `dwdm` | DWDM — dos racks unidos por hilos |
| `uptime` | Uptime — anillo grande con cifra |
| `prioridad` | Tráfico — lista priorizada con barras |
| `conmutacion` | Conmutación — rutas con failover |
| `mfa` | MFA — móvil con OTP y factores |
| `escudo` | Escudo — impactos que rebotan en el borde |
| `reloj` | Reloj — esfera con aguja que barre |
| `checklist` | Checklist — filas que se van marcando |
| `escalera` | Escalera — barras que crecen por escalones |
| `consola` | Consola — panel central con módulos |

### 3.2 `datosIlustracionField()` — un objeto plano, todos los campos opcionales

Un único objeto con los campos de **todas** las plantillas, no un objeto por plantilla: así la query de GraphQL y el componente se mantienen planos. Cada `description` dice a qué plantilla pertenece su campo, que es como se orienta el editor. Ninguno es obligatorio — cada plantilla trae valores de reserva codificados.

| campo | tipo | plantillas | i18n |
| --- | --- | --- | --- |
| `etiqueta` | string | Velocidad | `etiqueta_en` |
| `valor` | string | Uptime (la cifra, ej. `99,95`) | — |
| `unidad` | string | Uptime (ej. `% UPTIME`) | `unidad_en` |
| `porcentaje` | number 0–100 | Velocidad, Gauge, Uptime, Simetría, Escalera | — |
| `hilos` | number 3–8 | DWDM | — |
| `barras` | number 5–9 | Simetría | — |
| `tarjetas[]` | list (máx. 3) — `{ etiqueta, etiqueta_en, porcentaje }` | Velocidad | por ítem |
| `filas[]` | list (máx. 4) — `{ label, label_en, nivel, porcentaje }` | Prioridad | por ítem |
| `rutas[]` | list (máx. 4) — `{ label, label_en, activa }` | Conmutación | por ítem |
| `nodos[]` | list (máx. 4) — `{ label, label_en, icon }` | Sedes, Consola | por ítem |
| `chips[]` | list (máx. 4) — `{ label, label_en, icon }` | MFA, Checklist | por ítem |

`nivel` es un selector cerrado: `CRÍTICO` · `ALTA` · `MEDIA` · `BAJA`.
`icon` (dentro de `nodos`/`chips`) reusa el set de glifos `react-icons/fa6` que ya se importa hoy en `BeneficiosReact.tsx` — es el único sitio donde ese mapa sobrevive tras quitar el chip.

### 3.3 Paleta — `C` en `base.tsx`

```js
export const C = {
  acento:      "#96237A",              // brand-purple, trazo principal
  acentoClaro: "#c65fac",              // realces y estados encendidos
  acentoOscuro:"#650F50",              // brand-purple-dark, rellenos
  apagado:     "rgba(255,255,255,.28)",// lo que está "off"
  tenue:       "rgba(255,255,255,.12)", // rejillas, ejes, guías
  texto:       "rgba(255,255,255,.75)", // etiquetas dentro del SVG
  fondo:       "#0A0A0A",              // greyscale-darkest, el de la sección
};
```

Regla heredada de nexnet que se mantiene: **lo apagado es el mismo color a menos opacidad, nunca otro color** — así cada ilustración se lee como una sola pieza y no como dos objetos.

### 3.4 Asignación propuesta por subservicio

Los 35 JSON de `src/content/subservicios/`, en el orden de card que ya tienen. La columna "nexnet" es la referencia de origen; donde el slug difiere se indica entre paréntesis. Esta asignación es la de partida: si al implementar una card el texto pide otra plantilla, manda el texto.

| subservicio (Fiberlux) | cards | plantillas propuestas | nexnet |
| --- | --- | --- | --- |
| `anti-ddos` | 3 | escudo · gauge · escalera | gauge · conmutacion · escudo |
| `baas` | 3 | escudo · uptime · checklist | simetria · escudo · gauge |
| `balanceo-de-enlaces` | 4 | conmutacion · reloj · uptime · escudo | conmutacion · prioridad · escalera · gauge |
| `colaboracion-empresarial` | 3 | sedes · uptime · gauge | simetria · sedes · prioridad |
| `comunicaciones-unificadas` | 3 | escudo · simetria · sedes | simetria · prioridad · sedes · checklist |
| `concientizacion-phishing` | 3 | mfa · checklist · gauge | mfa · prioridad · gauge · reloj |
| `conectividad-satelital` | 3 | sedes · velocidad · escudo | sedes · conmutacion · gauge |
| `correlacion-eventos` | 3 | consola · escudo · reloj | (correlacion-eventos-automatizacion) prioridad · gauge · sedes · reloj |
| `draas` | 3 | reloj · conmutacion · escalera | conmutacion · conmutacion · gauge |
| `edr-xdr-mdr` | 4 | escudo · uptime · reloj · checklist | gauge · prioridad · mfa · checklist |
| `fibra-oscura` | 4 | dwdm · sedes · velocidad · escalera | dwdm · velocidad · escalera · sedes |
| `gestion-endpoints` | 3 | gauge · escudo · consola | gauge · mfa · prioridad |
| `gestion-redes-lan` | 3 | consola · escudo · uptime | sedes · prioridad · gauge · reloj · consola |
| `housing-colocacion` | 3 | escalera · uptime · dwdm | dwdm · consola · gauge |
| `internet-alta-disponibilidad` | 3 | uptime · conmutacion · escalera | conmutacion · uptime · gauge |
| `internet-corporativo` | 3 | velocidad · simetria · gauge | velocidad · simetria · gauge |
| `mesa-de-ayuda` | 3 | gauge · prioridad · escalera | gauge · prioridad · consola |
| `mfa-control-identidad` | 3 | mfa · gauge · velocidad | mfa · gauge · prioridad |
| `microservicios` | 4 | escalera · uptime · velocidad · consola | (arquitectura-microservicios) dwdm · prioridad · checklist · conmutacion |
| `nac` | 3 | mfa · escudo · sedes | mfa · sedes · gauge · escudo |
| `ngfw-seguridad-perimetral` | 3 | escudo · prioridad · gauge | prioridad · gauge · mfa |
| `nube-privada` | 3 | escudo · velocidad · escalera | dwdm · escalera · sedes · velocidad |
| `nube-publica` | 4 | velocidad · escalera · dwdm · uptime | dwdm · velocidad · escalera · simetria · consola |
| `pentesting` | 3 | escudo · checklist · gauge | (pentesting-evaluacion-vulnerabilidades) gauge · prioridad · checklist |
| `radioenlaces-empresariales` | 3 | sedes · velocidad · escalera | sedes · velocidad · escalera |
| `sd-wan` | 4 | prioridad · sedes · conmutacion · escalera | prioridad · conmutacion · sedes · escalera · dwdm |
| `seguridad-correo-filtrado-web` | 3 | escudo · checklist · prioridad | prioridad · gauge · mfa |
| `soc-24-7` | 3 | reloj · escudo · consola | (cyber-soc-24-7) gauge · prioridad · escudo · reloj |
| `storage-computo` | 3 | escalera · gauge · escudo | (storage-computo-empresarial) dwdm · velocidad · escudo |
| `transmision-de-datos-l2l` | 3 | escudo · simetria · sedes | sedes · simetria · consola |
| `videovigilancia-gestionada` | 3 | uptime · escudo · sedes | velocidad · sedes · consola · mfa |
| `vpn-segura` | 3 | sedes · mfa · consola | (vpn-segura-acceso-remoto) sedes · mfa · consola |
| `waf` | 3 | escudo · checklist · prioridad | (waf-proteccion-aplicaciones) gauge · prioridad · escudo · checklist |
| `wifi-gestionado` | 3 | sedes · velocidad · consola | sedes · velocidad · mfa · reloj · consola |
| `ztna` | 3 | mfa · sedes · uptime | mfa · sedes · prioridad |

Las 14 plantillas quedan usadas al menos una vez; ninguna card de un mismo subservicio repite plantilla.

---

## Sección 4 — Plan de implementación

1. **Andamiaje.** Crear `src/components/servicios/beneficios/base.tsx` portando de nexnet `PropsIlustracion`, `VB`, `Lienzo`, `ret`, `pct`, `anchoTexto`, `cajaEtiquetas` y `useTurno`, con la paleta `C` de la Sección 3.3 y el interruptor renombrado a `fbx-ben-on`. Crear `IlustracionBeneficio.tsx` con el registro vacío (mapa sin entradas todavía) y su contrato de props. Estado: compila, `IlustracionBeneficio` devuelve `null` siempre.

2. **Keyframes.** Portar el bloque `nx-ben-*` de `nextnet/src/styles/global.css` (≈290 líneas) a una constante `CSS_BENEFICIOS` exportada desde `base.tsx`, renombrando el prefijo a `fbx-ben-*` y conservando su bloque `prefers-reduced-motion`. Se inyecta desde el `<style>` de `BeneficiosReact.tsx`, porque `src/styles/global.css` no se empaqueta en este repo. Estado: CSS disponible, aún sin consumidores.

3. **Plantillas, tanda 1 (conectividad).** Portar `Velocidad`, `Simetria`, `Gauge`, `Sedes`, `Dwdm` y `Uptime` repintadas con `C`, y registrarlas en `IlustracionBeneficio`. Estado: 6 de 14 disponibles.

4. **Plantillas, tanda 2 (red y tráfico).** Portar `Prioridad`, `Conmutacion`, `Escalera` y `Consola`. Estado: 10 de 14.

5. **Plantillas, tanda 3 (seguridad).** Portar `Mfa`, `Escudo`, `Reloj` y `Checklist`. Estado: las 14 registradas.

6. **Schema Tina.** En `tina/config.ts`: añadir `PLANTILLA_BENEFICIO_OPTIONS` y el helper `datosIlustracionField()` con sus siblings `_en`; en `beneficios.items[]` quitar `icon` y añadir `plantilla`, `datos` e `image`. Regenerar el cliente. Estado: panel listo, contenido aún sin plantillas.

7. **Card nueva.** Reescribir `BeneficiosReact.tsx`: quitar `ItemIcon`, el mapa `ICONS` y los imports de `react-icons` que solo servían al chip; grid a `md:grid-cols-6` + `md:auto-rows-fr` con cards `md:col-span-2` y la corrección de columna de arranque para la última fila incompleta; pie con `mt-auto` que renderiza `image` si existe y si no `IlustracionBeneficio`; hook de viewport (una sola vez, sin re-disparar en hover) que enciende `fbx-ben-on`. Estado: cards sin ilustración se ven exactamente como hoy menos el chip.

8. **Contenido, tanda conectividad.** Asignar `plantilla` + `datos` y borrar `icon` en los subservicios de Conectividad, según la tabla 3.4. Estado: una categoría completa, verificable en `/soluciones/conectividad/internet-corporativo`.

9. **Contenido, resto de categorías.** Mismo trabajo en Ciberseguridad, Data Center / Cloud y Servicios Gestionados. Estado: las 112 cards con ilustración y sin `icon`.

10. **i18n de etiquetas.** Cablear `tField` en las plantillas que pintan texto (`Velocidad`, `Uptime`, `Prioridad`, `Conmutacion`, `Sedes`, `Consola`, `Mfa`, `Checklist`), pasándoles el `locale` desde `BeneficiosReact`. Estado: `/en` cae a ES por campo vacío, sin texto roto.

---

## Sección 5 — Criterios de aceptación

- [ ] `npm run build` termina sin errores y sin warnings nuevos de TypeScript.
- [ ] En `/soluciones/conectividad/internet-corporativo` las 3 cards muestran una ilustración distinta al pie (`velocidad`, `simetria`, `gauge`).
- [ ] Ninguna card de beneficio muestra ya el chip de ícono morado.
- [ ] `grep -c '"icon"' src/content/subservicios/*.json` no devuelve ninguna ocurrencia dentro del bloque `beneficios`.
- [ ] Los 35 JSON tienen `plantilla` en todas sus cards de `beneficios`.
- [ ] Los textos `title`, `title_en`, `text` y `text_en` de las 112 cards son byte a byte los de antes del spec (verificable con `git diff` filtrado).
- [ ] La ilustración arranca su animación la primera vez que la sección entra en viewport, y pasar el cursor por encima no la vuelve a lanzar.
- [ ] En un subservicio de 4 cards (`sd-wan`), la cuarta queda centrada en desktop, no pegada a la izquierda.
- [ ] En una fila de 3 cards con textos de distinto largo, las tres ilustraciones quedan alineadas a la misma altura.
- [ ] Con `prefers-reduced-motion: reduce` activo, las ilustraciones se ven en su estado final y no hay ningún bucle en marcha.
- [ ] Las ilustraciones no aparecen en el árbol de accesibilidad (`aria-hidden="true"`) ni son alcanzables con Tab.
- [ ] En el panel de Tina, elegir una plantilla en una card muestra la ilustración correspondiente en la vista previa, y las descripciones de `datos` indican a qué plantilla pertenece cada campo.
- [ ] Subir una imagen en `image` reemplaza la ilustración de esa card.
- [ ] En `/en/soluciones/conectividad/internet-corporativo` la sección se ve igual que en ES (etiquetas del SVG en fallback ES, sin huecos vacíos).
- [ ] En móvil (375 px) las cards van a una columna y la ilustración no desborda el ancho de la card.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** card sin chip de ícono, solo título + texto + ilustración. El chip repetía el mismo glifo en decenas de subservicios; la ilustración ya es el elemento gráfico y dos competían.
- **No:** conservar el chip encima de la ilustración. Habría dejado dos jerarquías gráficas en una card de 300 px de alto.
- **No:** ilustración arriba y texto debajo. Rompía la lectura título→texto que comparte el resto de la plantilla de subservicio.
- **Sí:** eliminar `icon` del schema y de los 35 JSON. El cliente prefirió el panel limpio antes que dejar un campo huérfano; el mapa de glifos no se pierde del todo porque `nodos[].icon` y `chips[].icon` lo siguen usando dentro de las plantillas.
- **Sí:** las 14 plantillas completas, no un subconjunto. Ya están escritas y probadas en nexnet; recortar a 8 obligaba a reasignar ~24 cards a una plantilla menos precisa para ahorrar código que no hay que escribir.
- **Sí:** paleta morada sobre el fondo oscuro actual. Mantiene la continuidad de la página de subservicio, que es negra de principio a fin.
- **No:** volver clara la sección de beneficios como en nexnet. Abría una franja blanca en medio de una página negra.
- **No:** acento magenta neón. El morado de marca ya distingue lo encendido de lo apagado; el neón habría competido con el glow de los heros cinematic.
- **Sí:** `datos` como un objeto plano con todos los campos de todas las plantillas. Es la decisión de nexnet y se mantiene por la misma razón: un objeto por plantilla multiplicaría la query de GraphQL por catorce.
- **Sí:** siblings `_en` en las etiquetas del SVG, vacíos. Es la convención del sitio (SPEC 80) y evita tener que volver a tocar el schema cuando el cliente quiera traducirlas.
- **No:** rellenar ahora el EN de las ~112 cards. El fallback ES ya deja el sitio coherente y el cliente refina el inglés en Tina.
- **Sí:** campo `image` que manda sobre la plantilla. Válvula de escape para el caso que ninguna de las 14 cubra, sin abrir un spec nuevo.
- **Sí:** keyframes en el `<style>` del componente y no en `global.css`. En este repo `global.css` no se empaqueta: lo que se escriba ahí no llega al navegador.
- **Sí:** prefijo `fbx-ben-*` en vez de heredar `nx-ben-*`. El prefijo `nx` es de nexnet y confunde en este repo.
- **Sí:** la asignación de plantillas de nexnet como guía, no como calco. Los textos de las cards de Fiberlux son distintos y el número de cards no siempre coincide.

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| 112 cards animándose en la misma página pesan en render | Cada ilustración solo arranca al entrar en viewport y son SVG estáticos con CSS animations, sin rAF ni JS por frame. Además solo hay 3–4 cards por página, no 112. |
| Las etiquetas que escribe el editor se salen de su caja SVG | Se portan `anchoTexto` y `cajaEtiquetas` de nexnet, que dimensionan la caja y bajan el cuerpo de la letra antes que recortar. |
| Ciclo de imports entre el registro y las plantillas | `base.tsx` vive aparte del registro por esta razón exacta (documentada en nexnet): la pila de `Velocidad` lee `C` al evaluar el módulo y con el ciclo reventaba con `Cannot read properties of undefined`. |
| El repintado a morado deja ilustraciones ilegibles sobre negro | La regla "lo apagado es el mismo color a menos opacidad" se valida card a card en la tanda de contenido de Conectividad (paso 8) antes de escalar al resto. |
| Quitar `icon` del schema rompe el build si algún JSON lo conserva | Tina ignora campos sobrantes en lectura, pero el paso 9 deja el `grep` de la lista de aceptación como comprobación explícita. |
| Cambiar `tina/config.ts` deja `client.ts` apuntando a localhost tras un build local | Procedimiento ya conocido en el proyecto: regenerar y revertir el `client.ts` antes de commitear. |

---

## Lo que **no** entra en este spec

- La sección de beneficios de la página `fiberlux-app`.
- Rellenar las traducciones EN de las etiquetas del SVG.
- Plantillas de ilustración nuevas fuera de las 14 portadas.
- Hacer editables en Tina los colores, tiempos o densidad de las ilustraciones.
- Cualquier otro bloque de la plantilla de subservicio (hero, casos de uso, FAQ).
- Portar de nexnet secciones distintas a Beneficios.

Cada una de ellas, si entra, va en su propio spec.
