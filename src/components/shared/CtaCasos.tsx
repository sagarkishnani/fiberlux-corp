import { PillLink } from "./fx/FxPrimitives";

export default function CtaCasos({ href, label, tinaFieldId }: { href: string; label: string; tinaFieldId?: string }) {
  if (!label) return null;
  return (
    <div className="fx-container mt-14 lg:mt-14">
      <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="flex flex-col lg:flex-row lg:justify-center">
        <PillLink href={href} iconSide="left" size="lg" className="!pr-5 lg:!pr-7" data-tina-field={tinaFieldId}>
          {label}
        </PillLink>
      </div>
    </div>
  );
}
