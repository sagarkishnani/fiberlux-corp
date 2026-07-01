import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { Components } from "tinacms/dist/rich-text";
import { FaCheck } from "react-icons/fa6";
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

  const page = data?.formasDePago;
  const banks = (page?.banks || []).filter(Boolean);
  if (!page || banks.length === 0) return null;

  // Step 5: render the steps of the first bank's first method (static).
  const bank = banks[0];
  const methods = (bank?.methods || []).filter(Boolean);
  const method = methods[0];
  const steps = (method?.steps || []).filter(Boolean) as StepData[];

  return (
    <section style={{ background: "#0a0a0a" }} className="pb-20 md:pb-28">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        {steps.length > 0 && (
          <div>
            {steps.map((step, i) => (
              <StepRow
                key={i}
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
