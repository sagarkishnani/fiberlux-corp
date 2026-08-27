import {
  LuZap,
  LuShield,
  LuCloud,
  LuSettings,
  LuUsersRound,
  LuNetwork,
  LuServer,
  LuGlobe,
  LuHeadset,
  LuDatabase,
  LuWifi,
  LuPhoneCall,
} from "react-icons/lu";
import type { IconType } from "react-icons";

/**
 * Set cerrado de íconos de categoría (`tabIcon` en Tina), en trazo.
 *
 * Vivía dentro de `SolucionesPanelReact` (SPEC 103); se saca aquí porque el
 * bloque nuevo (`SolucionesStackReact`, SPEC 108) usa el mismo set y no tiene
 * sentido mantener dos copias que se desincronicen.
 */
export const ICONS: Record<string, IconType> = {
  rayo: LuZap,
  escudo: LuShield,
  nube: LuCloud,
  engranaje: LuSettings,
  personas: LuUsersRound,
  red: LuNetwork,
  servidor: LuServer,
  globo: LuGlobe,
  soporte: LuHeadset,
  datos: LuDatabase,
  wifi: LuWifi,
  /* SPEC 109: categoría Comunicaciones Unificadas. */
  telefonia: LuPhoneCall,
};

/** Ícono de una categoría; valor ausente o desconocido → el rayo. */
export const iconFor = (key?: string | null): IconType => ICONS[key || ""] || LuZap;
