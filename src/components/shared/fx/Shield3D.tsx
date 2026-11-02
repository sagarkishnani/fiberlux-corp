const SHIELD_PATH = "M100 8 L176 36 V104 C176 158 140 196 100 214 C60 196 24 158 24 104 V36 Z";
const SHIELD_BACK_LAYERS = Array.from({ length: 16 }, (_, i) => -27.2 + i * 1.6);

export default function Shield3D({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div aria-hidden="true" className={`relative [perspective:1400px] ${size === "lg" ? "h-[333px] w-[300px] lg:h-[377px] lg:w-[340px]" : "h-[333px] w-[300px]"}`}>
      <div className="fx-shadow-pulse absolute inset-x-[10%] -bottom-[14%] h-[14%] rounded-full bg-[radial-gradient(closest-side,rgba(101,13,74,.32),rgba(101,13,74,0))]" />
      <div className="fx-shield absolute inset-0">
        {SHIELD_BACK_LAYERS.map((z) => (
          <svg key={z} viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${z}px)` }}>
            <path d={SHIELD_PATH} fill="#650D4A" opacity="0.92" />
          </svg>
        ))}
        {[-1.6, 0].map((z) => (
          <svg key={z} viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${z}px)` }}>
            <path d={SHIELD_PATH} fill="#B2308F" />
          </svg>
        ))}
        <svg viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: "translateZ(1px)" }}>
          <defs>
            <linearGradient id="fxShieldFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E0479E" />
              <stop offset=".5" stopColor="#96217A" />
              <stop offset="1" stopColor="#650D4A" />
            </linearGradient>
            <linearGradient id="fxShieldShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
              <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={SHIELD_PATH} fill="url(#fxShieldFace)" />
          <path d="M100 22 L164 46 V104 C164 150 134 184 100 200 C66 184 36 150 36 104 V46 Z" fill="none" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="2" />
          <path d="M100 8 L176 36 V96 C130 80 70 80 24 96 V36 Z" fill="url(#fxShieldShine)" />
        </svg>
        <svg viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: "translateZ(22px)" }}>
          <path d="M70 112 L92 134 L134 90" fill="none" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
