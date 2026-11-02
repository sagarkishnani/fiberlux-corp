import { useState, type ReactNode } from "react";

export const fieldLabelCls = "mb-2 block text-[13px] font-medium leading-[1.5] text-fx-ink";
export const fieldBaseCls =
  "w-full rounded-2xl border bg-fx-bg font-sans text-[14px] text-fx-ink outline-none transition-[border-color,background-color,box-shadow] duration-[250ms] placeholder:text-fx-muted hover:border-fx-lilac-strong focus:border-fx-purple focus:bg-white focus:shadow-[0_0_0_4px_rgba(150,33,122,.12)] disabled:cursor-not-allowed disabled:opacity-60";
export const fieldOkCls = "border-[#E6E3E6]";
export const fieldErrCls = "border-[#C81D87] bg-[#FDF5FA]";
export const fieldErrorTextCls = "mt-1.5 text-[12px] leading-[1.5] text-[#C81D87]";
export const fieldHintCls = "mt-2 text-[12px] leading-[1.5] text-fx-muted";

const inputCls = (error?: string) => `${fieldBaseCls} h-14 px-5 ${error ? fieldErrCls : fieldOkCls}`;

export function RequiredMark() {
  return <span className="text-[#C81D87]"> *</span>;
}

export function FieldLabel({ label, required, className = "" }: { label: string; required?: boolean; className?: string }) {
  if (!label) return null;
  return (
    <label className={`${fieldLabelCls} ${className}`}>
      {label}
      {required && <RequiredMark />}
    </label>
  );
}

export function FieldError({ error, className = "" }: { error?: string; className?: string }) {
  return error ? <p className={`${fieldErrorTextCls} ${className}`}>{error}</p> : null;
}

export function SelectChevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#96217A"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-5 top-5"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 shadow-[inset_0_0_0_3px_#fff] transition-all duration-[250ms] ${
        selected ? "border-fx-purple bg-fx-purple" : "border-fx-line-strong bg-white"
      }`}
    />
  );
}

/* ══════════════════════════════════════════════════
   SECTION HEADER — numbered badge + title
   ══════════════════════════════════════════════════ */
interface SectionHeaderProps {
  number: number;
  title: string;
}

export function FormSectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div className="mb-1 flex items-center gap-3.5 text-[18px] font-semibold leading-[1.3] text-fx-ink lg:text-[20px]">
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-fx-purple font-mono text-[13px] font-medium text-white">
        {number}
      </span>
      {title}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TEXT INPUT
   ══════════════════════════════════════════════════ */
interface InputProps {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
  inputMode?: "numeric" | "text";
}

export function FormInput({
  label, placeholder, type = "text", value, onChange, required, maxLength, error, disabled, inputMode,
}: InputProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        className={inputCls(error)}
      />
      <FieldError error={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SELECT
   ══════════════════════════════════════════════════ */
interface SelectProps {
  label: string;
  placeholder?: string;
  options: { value: string; label: string; group?: string }[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
}

/* Render <option>s, grouping into <optgroup> when a `group` is present. */
export function renderOptions(options: { value: string; label: string; group?: string }[]) {
  if (!options.some((o) => o.group)) {
    return options.map((opt, i) => (
      <option key={i} value={opt.value}>{opt.label}</option>
    ));
  }
  const order: string[] = [];
  const buckets = new Map<string, typeof options>();
  for (const opt of options) {
    const key = opt.group || "";
    if (!buckets.has(key)) { buckets.set(key, []); order.push(key); }
    buckets.get(key)!.push(opt);
  }
  return order.map((key, gi) => {
    const children = buckets.get(key)!.map((opt, i) => (
      <option key={i} value={opt.value}>{opt.label}</option>
    ));
    return key ? <optgroup key={gi} label={key}>{children}</optgroup> : children;
  });
}

export function FormSelect({
  label, placeholder, options, value, onChange, required, error,
}: SelectProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls(error)} cursor-pointer appearance-none pr-12 ${value ? "" : "text-fx-muted"}`}
        >
          <option value="" disabled>{placeholder || "Selecciona"}</option>
          {renderOptions(options)}
        </select>
        <SelectChevron />
      </div>
      <FieldError error={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TEXTAREA
   ══════════════════════════════════════════════════ */
interface TextareaProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  required?: boolean;
  maxLength?: number;
  error?: string;
}

export function FormTextarea({
  label, placeholder, value, onChange, rows = 4, required, maxLength, error,
}: TextareaProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className={`${fieldBaseCls} min-h-[140px] resize-y px-5 py-4 leading-[1.6] ${error ? fieldErrCls : fieldOkCls}`}
      />
      <div className="flex justify-between gap-4">
        <FieldError error={error} />
        {maxLength && (
          <span className="ml-auto mt-1.5 font-mono text-[12px] text-fx-muted">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FILE UPLOAD
   ══════════════════════════════════════════════════ */
interface FileUploadProps {
  label: string;
  helpText?: string;
  files: File[];
  onChange: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  required?: boolean;
  error?: string;
}

export function FormFileUpload({
  label, helpText, files, onChange, multiple = true, accept, required, error,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    onChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <FieldLabel label={label} required={required} />
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(Array.from(e.dataTransfer.files || []));
        }}
        className={`group/drop flex cursor-pointer items-center gap-[18px] rounded-2xl border-[1.5px] border-dashed px-6 py-[22px] transition-[border-color,background-color] duration-300 hover:border-fx-purple hover:bg-[#FAF0F6] ${
          dragging ? "border-fx-purple bg-[#FAF0F6]" : error ? "border-[#C81D87] bg-[#FDF5FA]" : "border-fx-lilac-strong bg-[#FCF8FB]"
        }`}
      >
        <input type="file" multiple={multiple} accept={accept} onChange={handleChange} className="hidden" />
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-white text-fx-purple transition-colors duration-300 group-hover/drop:bg-fx-purple group-hover/drop:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold text-fx-ink">Arrastra o selecciona archivos</span>
          <span className="text-[13px] text-fx-muted">
            {files.length === 0 ? helpText || "Sin archivos seleccionados" : `${files.length} archivo(s) seleccionado(s)`}
          </span>
        </span>
      </label>

      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-fx-bg px-4 py-2.5 text-[13px] text-fx-ink">
              <span className="min-w-0 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Quitar ${file.name}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-fx-muted transition-colors hover:bg-white hover:text-[#C81D87]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && helpText && <p className={fieldHintCls}>{helpText}</p>}
      <FieldError error={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CHECKBOX
   ══════════════════════════════════════════════════ */
interface CheckboxProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  children: ReactNode;
  error?: string;
}

export function FormCheckbox({ checked, onChange, children, error }: CheckboxProps) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3.5 text-[13px] leading-[1.55] text-fx-body">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span
          className={`mt-px grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] text-white transition-all duration-[250ms] peer-focus-visible:shadow-[0_0_0_4px_rgba(150,33,122,.12)] ${
            checked ? "border-fx-purple bg-fx-purple" : error ? "border-[#C81D87] bg-white" : "border-fx-line-strong bg-white"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={`transition-opacity duration-200 ${checked ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
        <span>{children}</span>
      </label>
      <FieldError error={error} className="ml-9" />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   RADIO GROUP (with title + description)
   ══════════════════════════════════════════════════ */
interface RadioOption {
  value: string;
  title: string;
  description?: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
}

export function FormRadioGroup({
  label, options, value, onChange, required, error,
}: RadioGroupProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} className="!mb-3" />
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt, i) => {
          const selected = value === opt.value;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col gap-2 rounded-[18px] border-[1.5px] px-6 py-[22px] text-left transition-[border-color,background-color] duration-300 hover:border-fx-purple ${
                selected ? "border-fx-purple bg-[#FAF0F6]" : "border-[#E6E3E6] bg-white"
              }`}
            >
              <span className="flex items-center justify-between gap-3 text-[16px] font-semibold text-fx-ink">
                {opt.title}
                <RadioDot selected={selected} />
              </span>
              {opt.description && <span className="text-[13px] leading-[1.55] text-fx-body">{opt.description}</span>}
            </button>
          );
        })}
      </div>
      <FieldError error={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CURRENCY INPUT (S/ prefix)
   ══════════════════════════════════════════════════ */
interface CurrencyProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export function FormCurrency({
  label, value, onChange, required, error, placeholder = "0.00",
}: CurrencyProps) {
  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChange(cleaned);
  };

  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <span className="pointer-events-none absolute left-5 top-0 flex h-14 items-center text-[14px] font-medium text-fx-muted">S/</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={`${inputCls(error)} !pl-12`}
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FORM PAGE HEADER (badge + title + description)
   ══════════════════════════════════════════════════ */
interface PageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
}

export function FormPageHeader({ badge, title, description }: PageHeaderProps) {
  return (
    <div className="mb-5">
      {badge && <div className="mb-3 font-mono text-[13px] font-medium tracking-[.18em] text-fx-purple">— {badge.toUpperCase()}</div>}
      {title && <h2 className="m-0 text-[26px] font-medium leading-[1.15] tracking-[-.02em] text-fx-ink lg:text-[32px]">{title}</h2>}
      {description && (
        <p className="mb-0 mt-4 max-w-[820px] text-[15px] leading-[1.7] text-fx-body [text-wrap:pretty]">{renderInlineLinks(description)}</p>
      )}
    </div>
  );
}

/* Renders markdown-style inline links — [texto](url) — inside a plain CMS string. */
const INLINE_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export function renderInlineLinks(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_LINK_RE.lastIndex = 0;
  while ((m = INLINE_LINK_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a
        key={m.index}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-fx-purple underline underline-offset-[3px] hover:text-fx-purple-hover"
      >
        {m[1]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length === 1 ? out[0] : out;
}

/* ══════════════════════════════════════════════════
   FORM SUBMIT BUTTON
   ══════════════════════════════════════════════════ */
interface SubmitProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function FormSubmitButton({ text, onClick, disabled, className = "" }: SubmitProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-14 items-center justify-center rounded-full bg-fx-purple px-10 text-[15px] font-medium text-white transition-[background-color,opacity] duration-300 hover:bg-fx-purple-hover disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {text}
    </button>
  );
}

/* ══════════════════════════════════════════════════
   NOTE — paragraph of text / legal text
   ══════════════════════════════════════════════════ */
interface NoteProps {
  text: string;
  size?: "sm" | "xs";
}

export function FormNote({ text, size = "sm" }: NoteProps) {
  return (
    <p className={`m-0 leading-[1.6] ${size === "xs" ? "text-[11px] text-fx-muted" : "text-[13px] text-fx-body"}`}>
      {renderInlineLinks(text)}
    </p>
  );
}

/* ══════════════════════════════════════════════════
   DIVIDER — horizontal line
   ══════════════════════════════════════════════════ */
export function FormDivider() {
  return <div className="my-2 border-t border-fx-soft" />;
}

/* ══════════════════════════════════════════════════
   INLINE RADIO — horizontal radio pills
   ══════════════════════════════════════════════════ */
interface InlineRadioProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
}

export function FormInlineRadio({
  label,
  options,
  value,
  onChange,
  required,
  error,
}: InlineRadioProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} className="!mb-3" />
      <div className="flex flex-wrap gap-2.5" role="radiogroup">
        {options.map((opt, i) => {
          const selected = value === opt.value;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`flex min-h-[52px] items-center gap-3 rounded-[14px] border-[1.5px] px-[22px] py-3 text-left text-[14px] leading-[1.5] text-fx-ink transition-[border-color,background-color] duration-[250ms] hover:border-fx-purple ${
                selected ? "border-fx-purple bg-[#FAF0F6]" : "border-[#E6E3E6] bg-white"
              }`}
            >
              <RadioDot selected={selected} />
              {opt.label}
            </button>
          );
        })}
      </div>
      <FieldError error={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CHECKBOX GROUP — multiple checkboxes
   ══════════════════════════════════════════════════ */
interface CheckboxGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (val: string[]) => void;
  required?: boolean;
  error?: string;
}

export function FormCheckboxGroup({
  label,
  options,
  value,
  onChange,
  required,
  error,
}: CheckboxGroupProps) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div>
      <FieldLabel label={label} required={required} className="!mb-3" />
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => (
          <label key={i} className="flex cursor-pointer items-start gap-3 text-[14px] leading-[1.55] text-fx-ink">
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="mt-px h-5 w-5 shrink-0 accent-fx-purple"
            />
            {opt.label}
          </label>
        ))}
      </div>
      <FieldError error={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DATE TRIPLET — Día / Mes / Año
   ══════════════════════════════════════════════════ */
interface DateTripletValue {
  day: string;
  month: string;
  year: string;
}

interface DateTripletProps {
  label: string;
  value: DateTripletValue;
  onChange: (val: DateTripletValue) => void;
  required?: boolean;
  error?: string;
}

export function FormDateTriplet({
  label,
  value,
  onChange,
  required,
  error,
}: DateTripletProps) {
  const partCls = `${inputCls(error)} text-center`;
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Día"
          value={value.day}
          onChange={(e) => onChange({ ...value, day: e.target.value.replace(/\D/g, "").slice(0, 2) })}
          className={partCls}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Mes"
          value={value.month}
          onChange={(e) => onChange({ ...value, month: e.target.value.replace(/\D/g, "").slice(0, 2) })}
          className={partCls}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Año"
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          className={partCls}
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}
