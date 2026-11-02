interface FormSuccessProps {
  title?: string;
  subtitle?: string;
  correlativo?: string;
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function FormSuccess({
  title = "¡Formulario enviado!",
  subtitle = "Tu solicitud ha sido registrada correctamente.",
  correlativo,
  compact = false,
  actionLabel,
  onAction,
}: FormSuccessProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "min-h-[420px] lg:min-h-[640px]" : "rounded-[28px] border border-fx-line bg-white px-6 py-16 lg:px-16 lg:py-24"
      }`}
    >
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-fx-purple text-white shadow-[0_20px_40px_-16px_rgba(150,33,122,.6)] lg:h-[88px] lg:w-[88px]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </div>
      <h2 className="mb-0 mt-8 text-[28px] font-medium leading-[1.15] tracking-[-.02em] text-fx-ink lg:text-[36px]">{title}</h2>
      <p className="mb-0 mt-3 max-w-[420px] text-[16px] leading-[1.6] text-fx-body">{subtitle}</p>
      {correlativo && (
        <span className="mt-6 inline-flex h-11 items-center rounded-full bg-[#FAF0F6] px-5 font-mono text-[14px] font-medium text-fx-purple-deep">
          N° {correlativo}
        </span>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-8 h-12 rounded-full border border-fx-line-strong bg-white px-6 text-[14px] font-medium text-fx-ink transition-colors duration-300 hover:border-fx-ink hover:bg-fx-ink hover:text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
