import type { PropsIlustracion } from "./base";

/**
 * Ilustración al pie de una card de "Beneficios" (SPEC 105).
 *
 * Con 35 sub-servicios y 3 a 4 cards cada uno son más de cien gráficos.
 * Dibujarlos como imágenes significaría cien archivos que alguien tendría que
 * exportar de nuevo cada vez que cambiara un dato, así que son catorce
 * plantillas de código: el editor elige una en Tina y la alimenta con `datos`.
 *
 * Lo compartido entre ellas está en `base.tsx`; aquí sólo vive el mapa.
 */
const PLANTILLAS: Record<string, (p: PropsIlustracion) => React.ReactElement> = {};

interface Props extends PropsIlustracion {
  /** Valor de `beneficios.items[].plantilla`. Vacío = card sin ilustración. */
  plantilla?: string | null;
}

export default function IlustracionBeneficio({ plantilla, datos, activo, locale }: Props) {
  const Componente = plantilla ? PLANTILLAS[plantilla] : undefined;
  if (!Componente) return null;
  return <Componente datos={datos} activo={activo} locale={locale} />;
}
