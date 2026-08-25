import Velocidad from "./Velocidad";
import Simetria from "./Simetria";
import Gauge from "./Gauge";
import Sedes from "./Sedes";
import Dwdm from "./Dwdm";
import Uptime from "./Uptime";
import Prioridad from "./Prioridad";
import Conmutacion from "./Conmutacion";
import Escalera from "./Escalera";
import Consola from "./Consola";
import Mfa from "./Mfa";
import Escudo from "./Escudo";
import Reloj from "./Reloj";
import Checklist from "./Checklist";
import Tunel from "./Tunel";
import ZeroTrust from "./ZeroTrust";
import Bitacora from "./Bitacora";
import type { PropsIlustracion } from "./base";

/**
 * Ilustración al pie de una card de "Beneficios" (SPEC 105, ampliada en el 107).
 *
 * Con 35 sub-servicios y 3 a 4 cards cada uno son más de cien gráficos.
 * Dibujarlos como imágenes significaría cien archivos que alguien tendría que
 * exportar de nuevo cada vez que cambiara un dato, así que son diecisiete
 * plantillas de código: el editor elige una en Tina y la alimenta con `datos`.
 *
 * Lo compartido entre ellas está en `base.tsx`; aquí sólo vive el mapa. Las que
 * son paneles con texto (Sedes, Tráfico, Panel, Escudo, Conmutación, Túnel,
 * Zero Trust y Bitácora) se dibujan con `Escena`, en HTML; el resto sigue en el
 * `Lienzo` SVG.
 */
const PLANTILLAS: Record<string, (p: PropsIlustracion) => React.ReactElement> = {
  velocidad: Velocidad,
  simetria: Simetria,
  gauge: Gauge,
  sedes: Sedes,
  dwdm: Dwdm,
  uptime: Uptime,
  prioridad: Prioridad,
  conmutacion: Conmutacion,
  escalera: Escalera,
  consola: Consola,
  mfa: Mfa,
  escudo: Escudo,
  reloj: Reloj,
  checklist: Checklist,
  tunel: Tunel,
  zerotrust: ZeroTrust,
  bitacora: Bitacora,
};

interface Props extends PropsIlustracion {
  /** Valor de `beneficios.items[].plantilla`. Vacío = card sin ilustración. */
  plantilla?: string | null;
}

export default function IlustracionBeneficio({ plantilla, datos, activo, locale }: Props) {
  const Componente = plantilla ? PLANTILLAS[plantilla] : undefined;
  if (!Componente) return null;
  return <Componente datos={datos} activo={activo} locale={locale} />;
}
