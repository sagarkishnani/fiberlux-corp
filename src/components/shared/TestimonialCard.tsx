import { mediaUrl } from "../../utils/mediaUrl";

interface TestimonialCardProps {
  quote: string;
  description?: string | null;
  name: string;
  role: string;
  company: string;
  avatar?: string | null;
  logo?: string | null;
}

const FRAME_PATH =
  'M6.16113 0.5H14.1113C16.0279 0.5 17.7807 1.57551 18.6191 3.30664L18.6221 3.31348L20.4346 6.91699C21.4422 8.95561 23.5426 10.2802 25.8379 10.2803H67.3076C69.6038 10.2803 71.7047 8.96689 72.7354 6.91699L72.7363 6.91406L74.5254 3.31055L74.5273 3.30664C75.3658 1.57558 77.1177 0.50006 79.0342 0.5H209.839C212.767 0.500155 215.181 2.72829 215.471 5.61523L215.477 5.70117V171.269C215.476 174.331 214.265 177.292 212.08 179.479L182.442 209.102L182.439 209.104C180.575 211.004 178.057 212.161 175.408 212.443C174.999 212.468 174.623 212.5 174.25 212.5H6.16113C3.01334 212.5 0.5 209.964 0.5 206.834V6.20117L0.506836 5.90625C0.657586 2.88813 3.11423 0.500118 6.16113 0.5Z';

// Avatar de respaldo cuando un testimonio no tiene foto propia.
const PLACEHOLDER_AVATAR = `${import.meta.env.BASE_URL}images/testimonials/avatar-placeholder.svg`;

export default function TestimonialCard({
  quote,
  description,
  name,
  role,
  company,
  avatar,
  logo,
}: TestimonialCardProps) {
  // Normaliza a asset local: Tina Cloud reescribe estos campos a URLs
  // https://assets.tina.io/... que rompían la foto en producción.
  const photoSrc = mediaUrl(avatar);
  const logoSrc = mediaUrl(logo);
  // obs_11: si no hay foto pero sí logo, se usa el logo en el frame (a veces no
  // hay fotos de la persona). Si no hay nada, el avatar genérico.
  const useLogoAsAvatar = !photoSrc && !!logoSrc;
  const frameSrc = photoSrc || (useLogoAsAvatar ? logoSrc : PLACEHOLDER_AVATAR);
  const frameFit = useLogoAsAvatar ? "object-contain bg-white p-2" : "object-cover";
  return (
    <div className="relative w-full h-full">
      {/* ── Desktop border SVG (contorno magenta, sin relleno) ── */}
      <svg
        className="hidden md:block absolute inset-0 w-full h-full"
        viewBox="0 0 1057 438"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M1055.87 34.0559V214.024C1055.87 231.161 1049.65 247.596 1038.58 259.76L893.937 418.049C882.871 430.159 867.804 436.971 852.144 436.971H31.1053C14.4573 436.971 0.970703 422.212 0.970703 403.994V34.0559C0.970703 15.7293 14.309 0.970703 31.0558 0.970703H69.8847C80.16 0.970703 89.5956 7.29579 94.0911 17.4592L102.934 36.7049C107.429 46.7061 116.864 53.1393 127.14 53.1393H329.682C339.958 53.1393 349.394 46.7061 354.037 36.7049L362.781 17.4592C367.276 7.29579 376.712 0.970703 386.987 0.970703H1025.84C1042.44 0.970703 1055.97 15.7833 1055.97 34.0559H1055.87Z"
          stroke="#96237A"
          strokeWidth="1.94"
          strokeMiterlimit="10"
        />
      </svg>

      {/* ── Mobile border SVG ── */}
      <svg
        className="md:hidden absolute inset-0 w-full h-full"
        viewBox="0 0 351 346"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M10.0127 0.5H22.9316C26.1635 0.500097 29.1215 2.31357 30.5371 5.23535L30.54 5.24219L33.4854 11.0957C35.0704 14.3032 38.3768 16.3877 41.9873 16.3877H109.375C112.986 16.3877 116.292 14.3216 117.915 11.0957L117.916 11.0928L120.823 5.23926L120.825 5.23535C122.241 2.31353 125.199 0.500051 128.431 0.5H340.987C346.072 0.5 350.23 4.49443 350.487 9.57227H350.462V278.21C350.462 283.267 348.462 288.156 344.852 291.768L296.69 339.888L296.688 339.892C293.603 343.032 289.441 344.941 285.068 345.406C284.41 345.445 283.778 345.5 283.156 345.5H10.0127C4.72363 345.5 0.5 341.24 0.5 335.984V10.0723C0.500126 4.94187 4.46557 0.76867 9.51953 0.512695L10.0127 0.5Z"
          stroke="#96237A"
        />
      </svg>

      {/* ── Content (tema claro: texto oscuro sobre el panel claro) ── */}
      <div className="relative z-10 p-6 pt-8 md:p-10 md:pt-16 h-full">
        {/* Desktop layout: avatar left + content right */}
        <div className="hidden md:grid md:grid-cols-[240px_1fr] md:gap-10 h-full">
          {/* Logo de la empresa (sin marco magenta ni placeholder). Fallback:
              nombre de la empresa como texto si aún no hay logo. */}
          <div className="flex items-center justify-center">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={company}
                className="max-h-[96px] w-auto max-w-full object-contain"
                draggable={false}
              />
            ) : (
              <span className="text-brand-purple text-subtitle-sm font-semibold text-center">
                {company}
              </span>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <h3 className="text-greyscale-darkest text-subtitle-sm font-semibold leading-snug mb-4">
                {quote}
              </h3>
              {description && (
                <p className="text-brand-gray-dark text-body-md leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <div className="mt-8">
              <p className="text-greyscale-darkest text-body-md font-semibold">{name}</p>
              <p className="text-brand-gray-dark text-body-sm">{role}</p>
            </div>
          </div>
        </div>

        {/* Mobile layout: stacked */}
        <div className="md:hidden flex flex-col justify-between h-full min-h-[300px]">
          <div>
            {/* Logo arriba del testimonio (fallback: nombre de empresa como texto) */}
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={company}
                className="max-h-[40px] w-auto max-w-[65%] object-contain mb-5"
                draggable={false}
              />
            ) : (
              <p className="text-brand-purple text-body-md font-semibold mb-5">
                {company}
              </p>
            )}
            <h3 className="text-greyscale-darkest text-subtitle-sm font-semibold leading-snug mb-4">
              &ldquo;{quote}&rdquo;
            </h3>
            {description && (
              <p className="text-brand-gray-dark text-body-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {/* Solo nombre + cargo (sin avatar ni chip) */}
          <div className="mt-6">
            <p className="text-greyscale-darkest text-body-md font-semibold">{name}</p>
            <p className="text-brand-gray-dark text-body-sm">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Tema oscuro anterior — reutilizar luego.
   Se conserva comentado por pedido del cliente. Los textos iban en blanco/tenue
   sobre el fondo oscuro de la sección:

   // Desktop:
   //   <h3 className="text-white text-subtitle-sm font-semibold leading-snug mb-4">{quote}</h3>
   //   <p  className="text-white/60 text-body-md leading-relaxed">{description}</p>
   //   <div className="flex items-center justify-between mt-8">
   //     <div>
   //       <p className="text-white text-body-md font-semibold">{name}</p>
   //       <p className="text-white/60 text-body-sm">{role}</p>
   //     </div>
   //     {logoSrc && <img src={logoSrc} alt={company} className="h-8 object-contain" />}
   //   </div>
   // Mobile: mismos textos en text-white / text-white/60.
   // El borde notched y el frame del avatar (magenta #96237A) eran idénticos.
──────────────────────────────────────────────────────────────────────────── */
