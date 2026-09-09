import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * LatticeField — retícula volumétrica RÍGIDA de puntos por la que viaja la luz
 * (SPEC 112). Fondo del hero del home en `heroBackground: "lattice"`.
 *
 * Es el cruce estructural de las dos referencias del cliente — la malla de
 * puntos con ondas expansivas (`dot-wave`) y la nube volumétrica de partículas
 * (guardz) — resuelto en UN SOLO sistema de puntos, no en dos capas
 * superpuestas.
 *
 * **REGLA DE ORO: los puntos no se mueven.** Están clavados en su nodo de la
 * retícula y lo único que viaja es la luz — igual que en el HTML de referencia,
 * donde los puntos solo crecen y brillan al pasar la onda. Una primera versión
 * los soltaba de su nodo al paso del frente y el cliente lo rechazó de plano:
 * se leía como ruido, "elementos por doquier", sin estructura. Las únicas
 * excepciones son las dos TRANSICIONES — la formación de entrada y la
 * dispersión de salida al scrollear — porque ahí la retícula no está en reposo:
 * está llegando o yéndose. Fuera de esas dos, es rígida.
 *
 * De ahí sale el concepto: **en reposo ves una malla; cuando el pulso la
 * atraviesa descubres que es un volumen.** El volumen no se dibuja, se revela.
 *
 * Cinco capas de comportamiento, todas sobre las mismas partículas:
 *
 *   1. **Retícula** — nodos fijos en una caja 3D, con una banda de foco
 *      estrecha que deja UNA capa nítida (el orden se lee) y el resto a oscuras.
 *   2. **Latido** — el pulso nace SIEMPRE detrás del wordmark FIBERLUX y sale en
 *      anillos concéntricos, con ritmo de latido (ráfaga + eco). Entre latidos
 *      la retícula queda tenue: el rango dinámico es lo que lo convierte en
 *      acontecimiento y no en textura.
 *   3. **Onda de señal** — un paquete de luz que recorre una traza sinusoidal
 *      de lado a lado, como una señal por un cable.
 *   4. **Puntero** — lente de luz que enciende y engorda los nodos a su
 *      alrededor; al hacer click, pulso desde ahí. Es lo que hace que el fondo
 *      deje de ser un vídeo.
 *   5. **Formación de entrada** — los puntos llegan sueltos y se cuadran en la
 *      retícula, cristalizando hacia fuera desde el wordmark.
 *
 * Truco central: no hay estado por partícula. Como el frente viaja a velocidad
 * constante desde un origen fijo, se despeja analíticamente el instante en que
 * cruzó a ESTA partícula (`age = t − t0 − d/speed`). Todo el trabajo por
 * partícula vive en el shader: en JS solo se mueven un puñado de uniforms por
 * frame, así que el coste no crece con el número de puntos. Un `t0` en el
 * futuro da `age < 0` y no enciende nada, así que una ráfaga de anillos se
 * programa entera de una vez.
 *
 * Transparente: el consumidor pone la base oscura debajo. Respeta
 * prefers-reduced-motion (retícula quieta y formada, sin eventos) y pausa el
 * rAF fuera de viewport.
 */

export type LatticeIntensity = "sutil" | "medio" | "intenso";

const PARAMS = {
  // ── Retícula ────────────────────────────────────────────────────────────
  // El paso LATERAL y el paso en PROFUNDIDAD son distintos a propósito, y es lo
  // que hace legible el efecto: con una retícula isótropa densa caben ~7 capas
  // en el rango visible, se superponen a escalas distintas y la proyección se
  // lee como ruido por muy ordenada que esté en 3D.
  spacing: 0.3, // paso lateral (unidades de mundo)
  spacingMobile: 0.3,
  spacingZ: 2.2, // paso entre capas
  spacingZMobile: 2.6,
  maxCount: 30000,
  maxCountMobile: 9000,
  halfHeight: 5.6, // semi-alto de la caja; el ancho sale del aspect ratio
  depth: 11.5,
  nearGap: 1.0,
  aspectMin: 0.5,
  aspectMax: 2.4,
  jitter: 0.05, // desorden dentro de la celda: casi nada, cada capa tiene que
  // leerse ordenada.

  // ── Cámara ──────────────────────────────────────────────────────────────
  fov: 55,
  dprCap: 1.75,
  dprCapMobile: 1.35,
  // Ojo con subirlo: el giro inclina cada capa en profundidad (halfW·sin(yaw)
  // unidades a lo ancho del encuadre) y en cuanto esa inclinación se acerca al
  // paso entre capas, una misma capa entra y sale de foco a lo largo de la
  // pantalla y todo se vuelve papilla.
  yaw: 0.05,
  pitch: 0.03,
  swayAmp: 0.012, // vaivén autónomo lentísimo (que nunca quede del todo quieta)
  swaySpeed: 0.1,
  pointerTilt: 0.035,
  pointerEase: 0.06,

  // ── Puntos ──────────────────────────────────────────────────────────────
  // Punto DURO y chico: el desenfoque suave de partículas gordas es la huella
  // de la referencia que no queremos. El brillo lo ponen los eventos.
  sizeBase: 3.2,
  sizeBright: 4.6,
  // Variación de brillo entre nodos MUY contenida, y es deliberado: con nodos
  // de brillos muy dispares (o un centelleo marcado) la retícula deja de leerse
  // como retícula aunque esté perfectamente ordenada — el ojo pierde la trama y
  // ve polvo. Verificado aislando el efecto: con brillo plano la malla salta a
  // la vista; con 50% de rango, desaparece.
  brightRatio: 0.08,
  baseDim: 0.78,
  twinkleSpeed: 0.9,
  twinkleAmp: 0.1,

  // ── Profundidad: reposo vs evento ───────────────────────────────────────
  // `focus` es una banda ESTRECHA que deja una sola capa nítida en reposo: es
  // lo que hace legible la retícula (varias capas superpuestas a escalas
  // distintas nunca se leen como orden). `wake` es una ventana MUCHO más ancha
  // que solo usan los eventos: por eso, cuando el pulso atraviesa, se encienden
  // también las capas del fondo y el campo se revela como volumen.
  focusDist: 4.6,
  focusWidth: 1.35,
  wakeWidth: 3.8,
  nearCut: [0.8, 1.7] as [number, number],
  // Reposo tenue a propósito: el contraste entre reposo y pulso es lo que
  // convierte el fondo en acontecimiento.
  // Al bajar el ambiente (un solo anillo flojo cada 9 s) el campo en reposo se
  // quedaba muy apagado y el hero perdía presencia entre eventos: la retícula
  // en sí tiene que sostenerse sola.
  restLevel: 0.78,
  // Topes de saturación. Los eventos se suman (latido + barrido + puntero) y
  // sin tope el campo se va a blanco y tapa el titular; y un punto encendido
  // cerca de la cámara se convierte en un disco enorme.
  eventCap: 2.2,
  maxPointPx: 13.0,

  // ── Anillos (latido + click) ────────────────────────────────────────────
  ring: {
    maxActive: 6,
    // El frente NO se expande a velocidad constante: r(t) = A·(1 − e^(−t/τ)).
    // Sale disparado y va frenando. Con velocidad constante el click no se
    // sentía satisfactorio — la onda salía con la misma inercia que una onda
    // ambiental, sin acuse de recibo. La desaceleración da el "chasquido":
    // respuesta inmediata bajo el cursor y salida que se asienta sola.
    reach: 11.0, // A: radio máximo (unidades)
    ease: 1.9, // τ: constante de tiempo de la expansión
    // El anillo tiene que ser MÁS ANCHO que una celda de la retícula (≈1.8
    // celdas): si es más estrecho, el frente cae entre nodos y en vez de un aro
    // se encienden puntos sueltos a radios distintos.
    // Ancho en ESPACIO, no en tiempo. Medido en tiempo, el grosor del aro es
    // |dr/dt|·width: al salir disparado eso son ~340 px de pegote que se va
    // afinando conforme frena. Es justo lo que hacía que el click no se
    // sintiera limpio. En espacio, el aro tiene el mismo grosor siempre (≈1.5
    // celdas) y se lee como un aro desde el primer frame.
    width: 0.45, // grosor del aro (unidades de mundo)
    life: 3.6, // s antes de liberar la ranura
    fadePow: 1.5, // curva de apagado: > 1 = aguanta y se va suave al final
    gain: 1.5, // cuánto enciende
    cap: 1.3, // tope de anillos solapados: sin él, una ráfaga satura el campo
    // entero en blanco y los puntos se vuelven manchas gigantes.
  },

  // ── Latido: el pulso nace detrás del wordmark ───────────────────────────
  heart: {
    anchor: [0.0, 0.34] as [number, number], // NDC del wordmark FIBERLUX
    // El origen va DETRÁS del plano de foco: así el frente llega primero a las
    // capas del fondo y avanza hacia la cámara — el pulso viene hacia ti, que
    // es justo lo que una referencia plana no puede hacer.
    depth: 6.2,
    // SOLO EN TÁCTIL. En desktop no hay latido automático ninguno: el pulso lo
    // pone el usuario al hacer click, y punto. Un latido de fondo, por flojo
    // que sea, compite con el suyo en vez de dejarle mandar. En táctil se
    // mantiene porque ahí es poco probable que nadie toque la pantalla y el
    // campo se quedaría inerte.
    autoOnTouch: true,
    // Pulso al cerrar la formación de entrada. DESACTIVADO: el cliente pidió
    // que no haya ningún pulso que no venga de un click suyo, ni siquiera el de
    // la entrada. A true, la formación termina con un anillo.
    onFormation: false,
    period: 9.0, // s entre latidos (solo táctil)
    burst: 1, // anillos por latido
    burstGap: 0.7,
    burstFalloff: 0.32,
    echoDelay: 2.1,
    echoStrength: 0.0, // eco desactivado: sobraba
    strength: 0.42,
    // Tras un click, el latido automático se aparta: nunca pisa tu onda.
    yieldAfterClick: 0.8, // fracción del periodo que se reprograma
  },

  // ── Onda de señal: paquete de luz sobre una traza sinusoidal ────────────
  sweep: {
    period: 14.0, // s entre barridos
    duration: 3.2, // s que tarda en cruzar
    amp: 1.1, // amplitud de la traza (unidades)
    freq: 0.85, // frecuencia espacial de la traza
    band: 0.55, // grosor de la traza
    packet: 2.6, // largo del paquete que viaja
    gain: 1.6,
    strength: 0.7,
  },

  // ── Puntero: lente de luz ───────────────────────────────────────────────
  pointer: {
    // Radio y ganancia calibrados contra el HTML de referencia, donde la lente
    // del ratón es un efecto MUY marcado (radio 140 px, escala +1.8): con un
    // radio pequeño y suave no se percibe que el fondo reaccione.
    radius: 0.34, // radio en NDC corregido por aspect
    gain: 2.4,
    ease: 0.16,
    // El click manda: bastante más fuerte que el latido ambiente (0.42).
    clickStrength: 1.7,
    clickDepth: 4.6, // el click nace en el plano de foco: aro inmediato
    // Destello local instantáneo bajo el cursor, aparte del anillo que sale.
    // Es el acuse de recibo táctil: sin él, el click solo lanza algo que se va,
    // y no se siente que hayas TOCADO nada.
    punch: 1.8,
    punchDecay: 6.5, // por segundo (decaimiento exponencial: casi todo el
    // destello se va en ~0.35 s, que es lo que hace que se sienta un golpe y no
    // una mancha que se queda)
  },

  // ── Formación de entrada ────────────────────────────────────────────────
  form: {
    duration: 2.0, // s hasta estar formada
    scatter: 3.2, // cuánto se alejan los puntos de su nodo al empezar
    stagger: 0.5, // fracción de la duración repartida como retardo
    delay: 0.25, // s de espera antes de arrancar
  },

  // ── Scroll: el plano de foco retrocede y la retícula se dispersa ────────
  focusPush: 4.2, // cuánto retrocede el plano de foco al bajar
  scrollFade: 0.28,
  disperse: {
    // La dispersión de salida NO va solo con la posición: va sobre todo con la
    // VELOCIDAD del scroll. Bajas de golpe y la retícula se deshace; te paras y
    // se recompone sola en su formación exacta. Es coherente con el resto: la
    // retícula es rígida y solo se rompe cuando algo la empuja.
    byScroll: 0.5, // parte que aporta el avance por el hero (posición)
    byVelocity: 0.85, // parte que aporta la velocidad
    velRef: 2600, // px/s que saturan el empuje por velocidad
    velEase: 0.25, // suavizado de la medida de velocidad
    amount: 0.55, // escala del desplazamiento (sobre el vector de dispersión)
    // Ataque rápido y retorno lento a propósito: la rotura tiene que ser
    // inmediata para que se sienta causada por TU scroll, y la vuelta a la
    // formación lenta para que se vea recomponerse.
    attack: 0.18,
    release: 0.055,
    fade: 0.4, // opacidad que se pierde con la dispersión completa
  },

  // ── Hueco de legibilidad ────────────────────────────────────────────────
  // Se aplica SOLO al reposo, nunca a los eventos: el campo se abre alrededor
  // del texto, pero el pulso sigue atravesándolo a plena potencia.
  textZone: [0.0, -0.1] as [number, number],
  textRadius: [0.4, 0.26] as [number, number],
  textDim: 0.5,
  textDepth: [2.4, 8.0] as [number, number],

  // ── Paleta: 100% Fiberlux, sin acento frío ──────────────────────────────
  colorDim: [0x6b, 0x33, 0x84] as [number, number, number],
  colorBright: [0xdc, 0x7a, 0xc8] as [number, number, number],
  // Magenta encendido de marca, NO blanco: con el tono casi blanco el pulso
  // decoloraba el campo entero.
  colorHot: [0xff, 0xbf, 0xf2] as [number, number, number],

  // Halo de fondo. NO lleva rejilla CSS: una grilla plana pintada sobre un
  // campo 3D es literalmente la superposición que hay que evitar — aquí la
  // grilla la dibuja la propia retícula.
  haloStops: ["#250820", "#120510", "#0A0A0A"] as const,
};

/** Presets de `hero.lattice.intensity`. */
const INTENSITY: Record<
  LatticeIntensity,
  { densityMul: number; opacity: number; sizeMul: number; gain: number }
> = {
  sutil: { densityMul: 0.75, opacity: 1.9, sizeMul: 0.9, gain: 0.7 },
  medio: { densityMul: 1.0, opacity: 2.6, sizeMul: 1.0, gain: 1.0 },
  intenso: { densityMul: 1.25, opacity: 3.3, sizeMul: 1.15, gain: 1.35 },
};

const f = (n: number) => n.toFixed(4);
const rgb = (c: [number, number, number]) =>
  `vec3(${f(c[0] / 255)}, ${f(c[1] / 255)}, ${f(c[2] / 255)})`;

const R = PARAMS.ring;
const S = PARAMS.sweep;

const VERT = `
attribute vec3  aJitter;
attribute vec3  aScatter;  // desplazamiento de entrada (SOLO durante la formación)
attribute float aStagger;  // 0..1: orden de llegada, hacia fuera desde el logo
attribute float aSize;
attribute float aPhase;
attribute float aBright;

uniform float uTime;
uniform float uForm;       // 0 = disperso, 1 = en formación
uniform float uDisperse;   // 0 = en formación, 1 = deshecha por el scroll
uniform float uFocus;      // distancia del plano nítido (retrocede al scrollear)
uniform float uOpacity;
uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uFade;
uniform float uGain;
uniform float uAspect;
uniform vec4  uRings[${R.maxActive}];   // xyz = origen, w = radio actual
uniform float uRingStr[${R.maxActive}];
uniform vec3  uSweep;      // x = posición del paquete, y = fase, z = fuerza
uniform vec4  uPointer;    // xy = NDC, z = lente continua, w = destello del click
uniform vec2  uTextZone;
uniform vec2  uTextRadius;

varying float vAlpha;
varying vec3  vColor;

void main() {
  vec3 node = position + aJitter;

  // Formación de entrada: la ÚNICA vez que un punto se mueve. El retardo por
  // partícula va con la distancia al wordmark, así que la retícula cristaliza
  // hacia fuera desde el logo.
  float ft = clamp(
    (uForm - aStagger * ${f(PARAMS.form.stagger)}) /
      (1.0 - ${f(PARAMS.form.stagger)}),
    0.0, 1.0
  );
  ft = 1.0 - pow(1.0 - ft, 3.0); // easeOutCubic
  // Las dos únicas veces que un punto se sale de su nodo: la formación de
  // entrada y la dispersión de salida. Comparten el mismo vector propio por
  // partícula, así que cada punto se va por su lado — sin eso la retícula se
  // escalaría en bloque y parecería un zoom, no una dispersión.
  float off = (1.0 - ft) + uDisperse * ${f(PARAMS.disperse.amount)};
  vec3 p = node + aScatter * off;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;

  // Reposo: banda estrecha → una capa nítida, se lee la malla.
  float dr = (dist - uFocus) / ${f(PARAMS.focusWidth)};
  float rest = exp(-dr * dr);
  // Eventos: ventana ancha → al pasar el pulso se encienden también las capas
  // del fondo y el campo se revela como volumen.
  float dw = (dist - uFocus) / ${f(PARAMS.wakeWidth)};
  float wake = exp(-dw * dw);
  float nearCut = smoothstep(${f(PARAMS.nearCut[0])}, ${f(
  PARAMS.nearCut[1]
)}, dist);

  vec2 ndc = gl_Position.xy / max(abs(gl_Position.w), 0.0001);

  // Hueco de legibilidad: SOLO sobre el reposo. El campo se abre alrededor del
  // texto, pero el pulso lo atraviesa entero.
  float q = length((ndc - uTextZone) / uTextRadius);
  float inside = 1.0 - smoothstep(0.35, 1.0, q);
  float nearW = 1.0 - smoothstep(${f(PARAMS.textDepth[0])}, ${f(
  PARAMS.textDepth[1]
)}, dist);
  rest *= mix(1.0, ${f(PARAMS.textDim)}, inside * nearW);

  // ── Eventos de luz. El punto NO se mueve: solo se enciende. ────────────
  // Anillos: el radio del frente lo calcula JS (es el mismo para todos los
  // puntos), así que aquí solo queda comparar distancias. Cero estado por
  // partícula y una sola exponencial por anillo.
  float ring = 0.0;
  for (int i = 0; i < ${R.maxActive}; i++) {
    float str = uRingStr[i];
    if (str > 0.0) {
      float w = (distance(p, uRings[i].xyz) - uRings[i].w) / ${f(R.width)};
      ring += str * exp(-w * w);
    }
  }
  ring = min(ring, ${f(R.cap)});

  // Onda de señal: paquete de luz viajando sobre una traza sinusoidal.
  float sig = 0.0;
  if (uSweep.z > 0.0) {
    float traceY = ${f(S.amp)} * sin(p.x * ${f(S.freq)} + uSweep.y);
    float dy = (p.y - traceY) / ${f(S.band)};
    float dx = (p.x - uSweep.x) / ${f(S.packet)};
    sig = uSweep.z * exp(-dy * dy) * exp(-dx * dx);
  }

  // Puntero: lente de luz en espacio de pantalla.
  float lens = 0.0;
  if (uPointer.z > 0.0 || uPointer.w > 0.0) {
    vec2 pd = (ndc - uPointer.xy) * vec2(uAspect, 1.0);
    float pq = length(pd) / ${f(PARAMS.pointer.radius)};
    // .z = lente que sigue al cursor; .w llega del destello del click y es más
    // concentrado (mitad de radio), para que el golpe se note bajo el dedo.
    lens = uPointer.z * exp(-pq * pq) + uPointer.w * exp(-4.0 * pq * pq);
  }

  float event = (ring * ${f(R.gain)} + sig * ${f(S.gain)}) * wake +
                lens * ${f(PARAMS.pointer.gain)} * rest;
  // Tope global: con varios eventos a la vez (latido + barrido + puntero) el
  // campo se iba a blanco y tapaba el titular.
  event = min(event * uGain, ${f(PARAMS.eventCap)});

  float twinkle = ${f(1 - PARAMS.twinkleAmp)} + ${f(
  PARAMS.twinkleAmp
)} * sin(uTime * ${f(PARAMS.twinkleSpeed)} + aPhase * 6.283);
  float base = mix(${f(PARAMS.baseDim)}, 1.0, aBright);

  vAlpha = uOpacity *
           (base * twinkle * rest * ${f(PARAMS.restLevel)} + event) *
           nearCut * uFade *
           (1.0 - uDisperse * ${f(PARAMS.disperse.fade)});

  vColor = mix(
    mix(${rgb(PARAMS.colorDim)}, ${rgb(PARAMS.colorBright)}, aBright),
    ${rgb(PARAMS.colorHot)},
    min(1.0, event * 0.5)
  );

  // El tope de tamaño es imprescindible: sin él un punto encendido cerca de la
  // cámara se convierte en un disco enorme.
  gl_PointSize = min(
    aSize * uSizeScale * uPixelRatio * (1.0 + event * 0.85) *
      (7.0 / max(dist, 0.25)),
    ${f(PARAMS.maxPointPx)} * uPixelRatio
  );
}
`;

const FRAG = `
precision mediump float;

varying float vAlpha;
varying vec3  vColor;

void main() {
  // Punto DURO: núcleo con borde apenas suavizado y un halo mínimo. Lo
  // contrario del bokeh difuso de la referencia.
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = smoothstep(1.0, 0.55, d);
  float glow = smoothstep(1.0, 0.0, d) * 0.2;
  float a = (core + glow) * vAlpha;
  if (a <= 0.003) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

interface Props {
  className?: string;
  intensity?: LatticeIntensity;
  /** Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  onUnsupported?: () => void;
}

export default function LatticeField({
  className,
  intensity = "medio",
  signalReady,
  onUnsupported,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onUnsupportedRef = useRef(onUnsupported);
  onUnsupportedRef.current = onUnsupported;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const preset = INTENSITY[intensity] ?? INTENSITY.medio;
    const isMobile =
      window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const hoverCapable =
      window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      onUnsupportedRef.current?.();
      return;
    }

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none;";
    mount.appendChild(canvas);

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      isMobile ? PARAMS.dprCapMobile : PARAMS.dprCap
    );
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(PARAMS.fov, 1, 0.1, 60);

    // ── Construcción de la retícula ──────────────────────────────────────
    // La caja se dimensiona contra el aspect ratio de montaje: tiene que cubrir
    // el frustum en su cara MÁS LEJANA, que es la ancha. Lo que sobra cerca de
    // la cámara son solo vértices — baratos — y el corte cercano los apaga.
    const aspect0 = Math.min(
      PARAMS.aspectMax,
      Math.max(
        PARAMS.aspectMin,
        (mount.clientWidth || 1) / (mount.clientHeight || 1)
      )
    );
    let spacing = isMobile ? PARAMS.spacingMobile : PARAMS.spacing;
    spacing /= Math.sqrt(preset.densityMul);
    const spacingZ = isMobile ? PARAMS.spacingZMobile : PARAMS.spacingZ;

    const halfH = PARAMS.halfHeight;
    const halfW = halfH * aspect0;
    const cap = isMobile ? PARAMS.maxCountMobile : PARAMS.maxCount;

    let nx = 0;
    let ny = 0;
    const nz = Math.max(3, Math.round(PARAMS.depth / spacingZ));
    // Si el conteo se dispara (pantallas muy anchas, intensidad alta) se abre el
    // paso hasta caber en el tope, en vez de recortar la caja: se prefiere una
    // retícula más suelta a una que no cubra el encuadre.
    for (let guard = 0; guard < 24; guard++) {
      nx = Math.max(4, Math.round((halfW * 2) / spacing));
      ny = Math.max(4, Math.round((halfH * 2) / spacing));
      if (nx * ny * nz <= cap) break;
      spacing *= 1.08;
    }

    const count = nx * ny * nz;
    const depth = nz * spacingZ;

    // Semi-extensiones del encuadre a la distancia de foco: sirven para situar
    // en el espacio de la retícula cualquier ancla dada en NDC (el wordmark, el
    // click), sin depender de las matrices de la cámara.
    const tanHalf = Math.tan((PARAMS.fov * Math.PI) / 360);
    const spanAt = (d: number) => ({
      y: tanHalf * d,
      x: tanHalf * d * aspect0,
    });

    const pos = new Float32Array(count * 3);
    const jitter = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const stagger = new Float32Array(count);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const brights = new Float32Array(count);

    // Ancla del latido en el plano lateral de la retícula: la formación
    // cristaliza hacia fuera desde ahí, y de ahí nacen los anillos.
    const anchorSpan = spanAt(PARAMS.heart.depth);
    const anchorX = PARAMS.heart.anchor[0] * anchorSpan.x;
    const anchorY = PARAMS.heart.anchor[1] * anchorSpan.y;
    const maxAnchorDist = Math.hypot(halfW + Math.abs(anchorX), halfH + Math.abs(anchorY));

    const jit = spacing * PARAMS.jitter;
    let i = 0;
    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let iz = 0; iz < nz; iz++) {
          const x = (ix - (nx - 1) / 2) * spacing;
          const y = (iy - (ny - 1) / 2) * spacing;
          pos[i * 3] = x;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = (iz - (nz - 1) / 2) * spacingZ;

          jitter[i * 3] = (Math.random() * 2 - 1) * jit;
          jitter[i * 3 + 1] = (Math.random() * 2 - 1) * jit;
          jitter[i * 3 + 2] = (Math.random() * 2 - 1) * jit;

          // Punto de partida de la formación: dirección aleatoria uniforme.
          const z0 = Math.random() * 2 - 1;
          const t0 = Math.random() * Math.PI * 2;
          const s0 = Math.sqrt(1 - z0 * z0);
          const m = PARAMS.form.scatter * (0.4 + Math.random() * 0.9);
          scatter[i * 3] = s0 * Math.cos(t0) * m;
          scatter[i * 3 + 1] = s0 * Math.sin(t0) * m;
          scatter[i * 3 + 2] = z0 * m;

          stagger[i] = Math.min(
            1,
            Math.hypot(x - anchorX, y - anchorY) / maxAnchorDist
          );

          const bright = Math.random() < PARAMS.brightRatio;
          brights[i] = bright ? 1 : 0;
          // Poca varianza de tamaño a propósito: tamaños muy dispares leen como
          // ruido y disuelven la retícula.
          sizes[i] = bright
            ? PARAMS.sizeBright * (0.9 + Math.random() * 0.2)
            : PARAMS.sizeBase * (0.92 + Math.random() * 0.16);
          phases[i] = Math.random();
          i++;
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aJitter", new THREE.BufferAttribute(jitter, 3));
    geometry.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    geometry.setAttribute("aStagger", new THREE.BufferAttribute(stagger, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aBright", new THREE.BufferAttribute(brights, 1));

    const uniforms = {
      uTime: { value: 0 },
      uForm: { value: reduce ? 1 : 0 },
      uDisperse: { value: 0 },
      uFocus: { value: PARAMS.focusDist },
      uOpacity: { value: preset.opacity },
      uPixelRatio: { value: dpr },
      uSizeScale: { value: preset.sizeMul },
      uFade: { value: 1 },
      uGain: { value: preset.gain },
      uAspect: { value: aspect0 },
      uRings: {
        value: Array.from(
          { length: R.maxActive },
          () => new THREE.Vector4(0, 0, 0, -999)
        ),
      },
      uRingStr: { value: new Array(R.maxActive).fill(0) as number[] },
      uSweep: { value: new THREE.Vector3(0, 0, 0) },
      uPointer: { value: new THREE.Vector4(0, 0, 0, 0) },
      uTextZone: { value: new THREE.Vector2(...PARAMS.textZone) },
      uTextRadius: { value: new THREE.Vector2(...PARAMS.textRadius) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // la caja envuelve a la cámara
    points.position.z = -(PARAMS.nearGap + depth / 2);
    scene.add(points);

    // ── Medidas ──────────────────────────────────────────────────────────
    let cw = 0;
    let ch = 0;

    function resize() {
      const w = Math.max(1, mount!.clientWidth);
      const h = Math.max(1, mount!.clientHeight);
      if (w === cw && h === ch) return false;
      cw = w;
      ch = h;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      uniforms.uAspect.value = cw / ch;
      camera.updateProjectionMatrix();
      return true;
    }
    resize();

    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        if (resize() && reduce) renderer.render(scene, camera);
      });
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ── Scroll: el foco retrocede, y la velocidad dispersa la retícula ───
    const D = PARAMS.disperse;
    let scrollP = 0;
    let lastScrollY = window.scrollY;
    let scrollVel = 0; // px/s, suavizada
    const readScroll = () => {
      const rect = mount!.getBoundingClientRect();
      const h = rect.height || window.innerHeight;
      scrollP = Math.min(1, Math.max(0, window.scrollY / (h * 1.15)));
    };
    readScroll();
    const onScroll = () => {
      if (!reduce) readScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Anillos ──────────────────────────────────────────────────────────
    const rings: { origin: THREE.Vector3; t0: number; strength: number }[] = [];

    /**
     * Programa un anillo. `delay` permite lanzar una ráfaga concéntrica de una
     * sola vez: mientras no le llega el turno, el anillo va con fuerza 0. El
     * origen se da en NDC + profundidad.
     */
    function addRing(
      strength: number,
      ndcX: number,
      ndcY: number,
      atDepth: number,
      delay = 0
    ) {
      if (reduce) return;
      const span = spanAt(atDepth);
      // De espacio de cámara a espacio local de la retícula: la cámara está en
      // el origen y la retícula solo lleva traslación en z (el giro es de pocos
      // grados y aquí no compensa arrastrar matrices).
      const origin = new THREE.Vector3(
        ndcX * span.x,
        ndcY * span.y,
        -atDepth - points.position.z
      );
      if (rings.length >= R.maxActive) rings.shift();
      rings.push({ origin, t0: uniforms.uTime.value + delay, strength });
    }

    function stepRings() {
      const now = uniforms.uTime.value;
      for (let k = rings.length - 1; k >= 0; k--) {
        if (now - rings[k].t0 > R.life) rings.splice(k, 1);
      }
      const slots = uniforms.uRings.value;
      const strs = uniforms.uRingStr.value;
      for (let k = 0; k < R.maxActive; k++) {
        const r = rings[k];
        if (!r || now < r.t0) {
          strs[k] = 0;
          continue;
        }
        const age = now - r.t0;
        // r(t) = A·(1 − e^(−t/τ)): sale disparado y va frenando. Con velocidad
        // constante el click no se sentía satisfactorio — la onda salía con la
        // misma inercia que una ambiental, sin acuse de recibo.
        const radius = R.reach * (1 - Math.exp(-age / R.ease));
        slots[k].set(r.origin.x, r.origin.y, r.origin.z, radius);
        // Apagado con curva: lineal cortaba el final de forma perceptible.
        strs[k] =
          r.strength * Math.pow(Math.max(0, 1 - age / R.life), R.fadePow);
      }
    }

    // ── Latido ───────────────────────────────────────────────────────────
    // Ráfaga de anillos concéntricos desde el wordmark + eco: el "lub-dub".
    const H = PARAMS.heart;
    function beat() {
      for (let k = 0; k < H.burst; k++) {
        addRing(
          H.strength * Math.pow(1 - H.burstFalloff, k),
          H.anchor[0],
          H.anchor[1],
          H.depth,
          k * H.burstGap
        );
      }
      if (H.echoStrength > 0) {
        addRing(
          H.strength * H.echoStrength,
          H.anchor[0],
          H.anchor[1],
          H.depth,
          H.echoDelay
        );
      }
    }
    // El latido recurrente es exclusivo de táctil (ver `heart.autoOnTouch`).
    const ambientBeat = H.autoOnTouch && !hoverCapable;
    let heartTimer = Infinity; // arranca (o no) al terminar la formación

    // ── Onda de señal ────────────────────────────────────────────────────
    let sweepTimer = S.period * 0.55;
    let sweepT = -1; // <0 = inactivo
    const sweepFrom = -halfW - S.packet;
    const sweepTo = halfW + S.packet;

    function stepSweep(dt: number) {
      if (sweepT >= 0) {
        sweepT += dt / S.duration;
        if (sweepT >= 1) {
          sweepT = -1;
          uniforms.uSweep.value.set(0, 0, 0);
          sweepTimer = S.period;
          return;
        }
        // Entra y sale con envolvente, para que no aparezca ni desaparezca de
        // golpe en los bordes.
        const env = Math.sin(Math.PI * sweepT);
        uniforms.uSweep.value.set(
          sweepFrom + (sweepTo - sweepFrom) * sweepT,
          uniforms.uTime.value * 1.6,
          S.strength * env
        );
        return;
      }
      sweepTimer -= dt;
      if (sweepTimer <= 0) sweepT = 0;
    }

    // ── Puntero: lente de luz + click ────────────────────────────────────
    const pointerNdc = { x: 0, y: 0 };
    let pointerWant = 0;
    let punch = 0; // destello del click, decae solo
    const tilt = { x: 0, y: 0 };
    const tiltTarget = { x: 0, y: 0 };
    const pointerEnabled = hoverCapable && !reduce;

    const insideRect = (x: number, y: number) => {
      const rect = mount!.getBoundingClientRect();
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      );
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const rect = mount!.getBoundingClientRect();
      const nx2 = (e.clientX - rect.left) / rect.width;
      const ny2 = (e.clientY - rect.top) / rect.height;
      pointerNdc.x = nx2 * 2 - 1;
      pointerNdc.y = -(ny2 * 2 - 1);
      pointerWant = insideRect(e.clientX, e.clientY) ? 1 : 0;
      tiltTarget.y = (nx2 - 0.5) * 2 * PARAMS.pointerTilt;
      tiltTarget.x = (ny2 - 0.5) * 2 * PARAMS.pointerTilt;
    };
    const onPointerLeave = () => {
      pointerWant = 0;
    };
    if (pointerEnabled) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave, {
        passive: true,
      });
    }

    // Click en el hero = anillo desde donde se hizo click. Se escucha en window
    // y se filtra por el rect (el canvas no recibe eventos), ignorando los
    // elementos interactivos para no competir con los botones del hero.
    const onClick = (e: MouseEvent) => {
      if (reduce || !visible) return;
      const el = e.target as Element | null;
      if (el?.closest?.("a, button, input, select, textarea, label")) return;
      if (!insideRect(e.clientX, e.clientY)) return;
      const rect = mount!.getBoundingClientRect();
      const nx3 = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny3 = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      addRing(
        PARAMS.pointer.clickStrength,
        nx3,
        ny3,
        PARAMS.pointer.clickDepth
      );
      // Destello local: acuse de recibo bajo el cursor. En touch no hay lente
      // continua, así que se sitúa el punto antes de encenderlo.
      pointerNdc.x = nx3;
      pointerNdc.y = ny3;
      punch = PARAMS.pointer.punch;
      // El latido automático se aparta para no pisar la onda del usuario.
      if (heartTimer !== Infinity) {
        heartTimer = Math.max(heartTimer, H.period * H.yieldAfterClick);
      }
    };
    window.addEventListener("click", onClick, { passive: true });

    // ── Loop ─────────────────────────────────────────────────────────────
    let raf = 0;
    let visible = true;
    let signaled = false;
    let lastMs = 0;
    let formT = -PARAMS.form.delay;
    let formationClosed = false;

    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    const minFrameMs = hoverCapable ? 0 : 1000 / 30;
    let lastDrawMs = -Infinity;

    function frame(ms: number) {
      if (ms - lastDrawMs < minFrameMs) {
        raf = visible ? requestAnimationFrame(frame) : 0;
        return;
      }
      lastDrawMs = ms;
      const dt = lastMs ? Math.min((ms - lastMs) / 1000, 0.05) : 0.016;
      lastMs = ms;
      uniforms.uTime.value += dt;

      // Formación de entrada; el primer latido sale justo al cuadrarse.
      if (uniforms.uForm.value < 1) {
        formT += dt;
        uniforms.uForm.value = Math.min(
          1,
          Math.max(0, formT / PARAMS.form.duration)
        );
        if (uniforms.uForm.value >= 0.82 && !formationClosed) {
          formationClosed = true;
          if (H.onFormation) beat();
          // El latido recurrente solo arranca en táctil; en desktop manda el
          // click y no hay nada automático.
          heartTimer = ambientBeat ? H.period : Infinity;
        }
      }

      if (heartTimer !== Infinity) {
        heartTimer -= dt;
        if (heartTimer <= 0) {
          heartTimer = H.period;
          beat();
        }
      }
      stepRings();
      stepSweep(dt);

      // Puntero: la fuerza entra y sale suave para que la lente no parpadee.
      const ptr = uniforms.uPointer.value;
      ptr.x = pointerNdc.x;
      ptr.y = pointerNdc.y;
      ptr.z += (pointerWant - ptr.z) * PARAMS.pointer.ease;
      if (ptr.z < 0.004) ptr.z = 0;
      punch = Math.max(0, punch - punch * PARAMS.pointer.punchDecay * dt);
      if (punch < 0.004) punch = 0;
      ptr.w = punch;

      // Scroll: el plano de foco retrocede y el campo se apaga.
      uniforms.uFocus.value = PARAMS.focusDist + scrollP * PARAMS.focusPush;
      uniforms.uFade.value = 1 - scrollP * (1 - PARAMS.scrollFade);

      // Dispersión de salida. La velocidad se mide en el loop (no en el evento
      // de scroll) para tener un dt fiable; con Lenis el scrollY ya viene
      // suavizado, así que la medida no da tirones.
      const y = window.scrollY;
      const instVel = Math.abs(y - lastScrollY) / Math.max(dt, 0.001);
      lastScrollY = y;
      scrollVel += (instVel - scrollVel) * D.velEase;
      const velN = Math.min(1, scrollVel / D.velRef);
      const dispTarget = Math.min(
        1,
        scrollP * D.byScroll + velN * D.byVelocity
      );
      const cur = uniforms.uDisperse.value;
      // Se rompe rápido y se recompone lento: la rotura tiene que sentirse
      // causada por TU scroll, y la vuelta a la formación tiene que verse.
      uniforms.uDisperse.value +=
        (dispTarget - cur) * (dispTarget > cur ? D.attack : D.release);

      tilt.x += (tiltTarget.x - tilt.x) * PARAMS.pointerEase;
      tilt.y += (tiltTarget.y - tilt.y) * PARAMS.pointerEase;
      const sway =
        Math.sin(uniforms.uTime.value * PARAMS.swaySpeed) * PARAMS.swayAmp;
      points.rotation.set(
        PARAMS.pitch + tilt.x,
        PARAMS.yaw + sway + tilt.y,
        sway * 0.4
      );

      renderer.render(scene, camera);
      signalOnce();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) {
          lastMs = 0;
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );
    io.observe(mount);

    if (reduce) {
      points.rotation.set(PARAMS.pitch, PARAMS.yaw, 0);
      renderer.render(scene, camera);
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("click", onClick);
      io.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, [intensity, signalReady]);

  // Halo radial morado sobre el negro base — y NADA más: sin rejilla CSS. Una
  // grilla plana encima del campo 3D es exactamente la superposición que este
  // modo evita; aquí la grilla la dibuja la propia retícula.
  const halo = `radial-gradient(115% 85% at 50% 42%, ${PARAMS.haloStops[0]} 0%, ${PARAMS.haloStops[1]} 48%, ${PARAMS.haloStops[2]} 100%)`;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: "relative", overflow: "hidden", background: halo }}
    >
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}
