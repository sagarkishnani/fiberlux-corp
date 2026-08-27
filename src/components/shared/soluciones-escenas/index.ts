import type { ComponentType } from "react";
import type { PropsEscena } from "./base";
import Orbita from "./Orbita";
import Bitacora from "./Bitacora";
import Nube from "./Nube";
import Waveform from "./Waveform";
import Telefonia from "./Telefonia";

/**
 * Qué escena le toca a cada categoría (SPEC 108).
 *
 * Se resuelve desde el `tabIcon` que el cliente ya elige en Tina —no hay campo
 * nuevo— y si la clave no está en el mapa (porque el cliente eligió otro ícono)
 * se cae al orden del bloque, que es el de los mockups.
 */

export type Escena = ComponentType<PropsEscena>;

const POR_ICONO: Record<string, Escena> = {
  rayo: Orbita,
  red: Orbita,
  wifi: Orbita,
  globo: Orbita,
  escudo: Bitacora,
  nube: Nube,
  servidor: Nube,
  datos: Nube,
  personas: Waveform,
  engranaje: Waveform,
  soporte: Waveform,
  /* SPEC 109: la quinta categoría, Comunicaciones Unificadas. */
  telefonia: Telefonia,
};

const POR_ORDEN: Escena[] = [Orbita, Bitacora, Nube, Waveform, Telefonia];

export function escenaPara(tabIcon: string | null | undefined, indice: number): Escena {
  return POR_ICONO[tabIcon || ""] || POR_ORDEN[indice % POR_ORDEN.length];
}

export { Orbita, Bitacora, Nube, Waveform, Telefonia };
