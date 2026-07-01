import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { Components } from "tinacms/dist/rich-text";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import type {
  FormasDePagoQuery,
  FormasDePagoQueryVariables,
} from "../../../tina/__generated__/types";

interface FormasPagoSelectorProps {
  query: string;
  variables: FormasDePagoQueryVariables;
  data: FormasDePagoQuery;
}

/** Render bold marks as magenta emphasis + tidy sub-bullets, per the design. */
const descriptionComponents: Components<{}> = {
  bold: (props: any) => (
    <strong className="font-semibold text-[#c65fac]">{props.children}</strong>
  ),
  ul: (props: any) => (
    <ul className="mt-2 space-y-1 text-greyscale-light">{props.children}</ul>
  ),
  li: (props: any) => (
    <li className="flex gap-2">
      <span aria-hidden="true">–</span>
      <span>{props.children}</span>
    </li>
  ),
};

interface StepData {
  title?: string | null;
  description?: any;
  image?: string | null;
}

/** One numbered step: title + checkmark description on the left, screenshot on the right. */
function StepRow({ step, tinaId }: { step: StepData; tinaId?: string }) {
  return (
    <div className="grid md:grid-cols-[1fr_minmax(0,420px)] gap-6 md:gap-10 items-center py-10 border-t border-white/10">
      <div>
        <h3 className="text-[22px] md:text-[26px] leading-[1.2] font-semibold text-greyscale-white">
          {step.title}
        </h3>
        <div className="flex gap-3 mt-4">
          <FaCheck
            className="mt-1 shrink-0 text-[#c65fac]"
            size={16}
            aria-hidden="true"
          />
          <div
            className="text-body-md text-greyscale-light leading-relaxed"
            data-tina-field={tinaId}
          >
            <TinaMarkdown
              content={step.description}
              components={descriptionComponents}
            />
          </div>
        </div>
      </div>

      {step.image ? (
        <div className="md:justify-self-end w-full">
          <img
            src={step.image}
            alt={step.title || "Paso"}
            className="w-full max-w-[420px] rounded-lg"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="md:justify-self-end w-full max-w-[420px] aspect-[4/3] rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="font-mono text-caption-sm text-greyscale">
            Imagen del paso
          </span>
        </div>
      )}
    </div>
  );
}

/** Dark rounded dropdown matching the design (native select + chevron overlay). */
function Dropdown({
  ariaLabel,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  value: number;
  onChange: (i: number) => void;
  options: string[];
}) {
  return (
    <div className="relative w-full sm:w-[240px]">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none rounded-lg bg-white/[0.04] border border-white/15 text-greyscale-white text-body-sm pl-4 pr-10 py-3 cursor-pointer hover:border-white/30 focus:outline-none focus:border-[#c65fac] transition-colors"
      >
        {options.map((label, i) => (
          <option key={i} value={i} className="bg-greyscale-darkest text-white">
            {label}
          </option>
        ))}
      </select>
      <FaChevronDown
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-greyscale"
        size={12}
        aria-hidden="true"
      />
    </div>
  );
}

export default function FormasPagoSelectorReact({
  query,
  variables,
  data: initialData,
}: FormasPagoSelectorProps) {
  const { data } = useTina<FormasDePagoQuery>({
    query,
    variables,
    data: initialData,
  });

  const [bankIdx, setBankIdx] = useState(0);
  const [methodIdx, setMethodIdx] = useState(0);

  const page = data?.formasDePago;
  const banks = (page?.banks || []).filter(Boolean);
  if (!page || banks.length === 0) return null;

  // Clamp indexes defensively so a shorter bank/method list never renders out of range.
  const safeBankIdx = Math.min(bankIdx, banks.length - 1);
  const bank = banks[safeBankIdx];
  const methods = (bank?.methods || []).filter(Boolean);
  const safeMethodIdx = Math.min(methodIdx, Math.max(methods.length - 1, 0));
  const method = methods[safeMethodIdx];
  const steps = (method?.steps || []).filter(Boolean) as StepData[];

  const handleBankChange = (i: number) => {
    setBankIdx(i);
    setMethodIdx(0); // reset method when the bank changes
  };

  return (
    <section style={{ background: "#0a0a0a" }} className="pb-20 md:pb-28">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        {/* Selectors */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2 pb-6">
          <Dropdown
            ariaLabel={page.bankSelectLabel || "Selecciona tu banco"}
            value={safeBankIdx}
            onChange={handleBankChange}
            options={banks.map(
              (b, i) => b?.optionLabel || b?.name || `Banco ${i + 1}`
            )}
          />
          {methods.length > 0 && (
            <Dropdown
              ariaLabel={page.methodSelectLabel || "Selecciona el método"}
              value={safeMethodIdx}
              onChange={setMethodIdx}
              options={methods.map((m, i) => m?.label || `Método ${i + 1}`)}
            />
          )}
        </div>

        {/* Steps of the active bank + method */}
        {steps.length > 0 && (
          <div>
            {steps.map((step, i) => (
              <StepRow
                key={`${safeBankIdx}-${safeMethodIdx}-${i}`}
                step={step}
                tinaId={method ? tinaField(method as any, "steps") : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
