import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../../utils/mediaUrl";

interface HeroVideoProps {
  /** Ruta del video (mp4). Se normaliza con mediaUrl() (assets.tina.io → public en prod). */
  src?: string | null;
  /** Poster estático: se ve mientras carga y en reduce-motion (sin reproducción). */
  poster?: string | null;
  className?: string;
}

/**
 * Video de hero en loop, silenciado y a sangre, pensado para fundirse con el
 * fondo mediante `mix-blend-mode: screen` (el video trae fondo oscuro → screen
 * lo vuelve casi transparente sobre el near-black del hero).
 *
 * Respeta `prefers-reduced-motion`: no reproduce y muestra solo el poster.
 */
export default function HeroVideo({ src, poster, className = "" }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduceMotion(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
  }, []);

  // React no refleja `muted` como atributo en el HTML de SSR, así que lo fijamos
  // por propiedad y forzamos el autoplay silencioso una vez montado.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, []);

  const videoSrc = mediaUrl(src);
  const posterSrc = mediaUrl(poster);
  if (!videoSrc) return null;

  // reduce-motion → solo poster (imagen), sin cargar/reproducir el video.
  if (reduceMotion) {
    if (!posterSrc) return null;
    return (
      <img
        src={posterSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`block w-full h-auto ${className}`}
        style={{ mixBlendMode: "screen" }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      suppressHydrationWarning
      className={`block w-full h-auto ${className}`}
      style={{ mixBlendMode: "screen" }}
    />
  );
}
