import type { ReactNode } from "react";

/* ── Styles ── */
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#1A1A1A",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  marginBottom: "8px",
  fontFamily: "Poppins, sans-serif",
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E8E1E5",
  borderRadius: "12px",
  padding: "14px 16px",
  fontSize: "14px",
  color: "#1A1A1A",
  backgroundColor: "#ffffff",
  fontFamily: "Poppins, sans-serif",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const inputErrorStyle: React.CSSProperties = {
  ...inputBaseStyle,
  borderColor: "#EF4444",
};

const errorTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#EF4444",
  marginTop: "4px",
  fontFamily: "Poppins, sans-serif",
};

const placeholderColor = "#9CA3AF";

/* ══════════════════════════════════════════════════
   SECTION HEADER — numbered circle + title
   ══════════════════════════════════════════════════ */
interface SectionHeaderProps {
  number: number;
  title: string;
}

export function FormSectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "24px" }}>
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "#96237A",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {number}
      </div>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A", fontFamily: "Poppins, sans-serif", lineHeight: 1.3, margin: 0 }}>
        {title}
      </div>
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
}

export function FormInput({
  label, placeholder, type = "text", value, onChange, required, maxLength, error, disabled,
}: InputProps) {
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#96237A" }}>*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          ...(error ? inputErrorStyle : inputBaseStyle),
          ...(disabled ? { backgroundColor: "#F9FAFB", color: "#9CA3AF", cursor: "not-allowed" } : {}),
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = "#96237A";
          e.currentTarget.style.boxShadow = "0 0 0 2px rgba(150,35,122,0.1)";
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = "#E8E1E5";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {error && <p style={errorTextStyle}>{error}</p>}
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
function renderOptions(options: { value: string; label: string; group?: string }[]) {
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
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#96237A" }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...(error ? inputErrorStyle : inputBaseStyle),
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          backgroundSize: "12px",
          color: value ? "#1A1A1A" : placeholderColor,
        }}
      >
        <option value="" disabled>{placeholder || "Selecciona"}</option>
        {renderOptions(options)}
      </select>
      {error && <p style={errorTextStyle}>{error}</p>}
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
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#96237A" }}>*</span>}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        rows={rows}
        maxLength={maxLength}
        style={{
          ...(error ? inputErrorStyle : inputBaseStyle),
          resize: "none",
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = "#96237A";
          e.currentTarget.style.boxShadow = "0 0 0 2px rgba(150,35,122,0.1)";
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = "#E8E1E5";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        {error ? <p style={errorTextStyle}>{error}</p> : <span />}
        {maxLength && (
          <span style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: "Poppins, sans-serif" }}>
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    onChange(multiple ? [...files, ...newFiles] : newFiles);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#96237A" }}>*</span>}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            border: "1px solid #96237A",
            color: "#96237A",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Poppins, sans-serif",
            transition: "all 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="#96237A" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Elegir archivos
          <input
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </label>
        <span style={{ fontSize: "13px", color: "#9CA3AF", fontFamily: "Poppins, sans-serif" }}>
          {files.length === 0 ? "Sin archivos seleccionados" : `${files.length} archivo(s)`}
        </span>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
          {files.map((file, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 12px",
                backgroundColor: "#FBF7FA",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#1A1A1A",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#EF4444",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                  padding: "0 4px",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {helpText && (
        <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "6px", fontFamily: "Poppins, sans-serif" }}>
          {helpText}
        </p>
      )}
      {error && <p style={errorTextStyle}>{error}</p>}
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
      <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            marginTop: "3px",
            width: "16px",
            height: "16px",
            accentColor: "#96237A",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "13px", color: "#5B5B5B", lineHeight: 1.5, fontFamily: "Poppins, sans-serif" }}>
          {children}
        </span>
      </label>
      {error && <p style={{ ...errorTextStyle, marginLeft: "26px" }}>{error}</p>}
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
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#96237A" }}>*</span>}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {options.map((opt, i) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px 20px",
                borderRadius: "12px",
                border: `1px solid ${isSelected ? "#96237A" : "#E8E1E5"}`,
                backgroundColor: isSelected ? "#FBF7FA" : "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <input
                type="radio"
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                style={{
                  marginTop: "2px",
                  width: "18px",
                  height: "18px",
                  accentColor: "#96237A",
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", fontFamily: "Poppins, sans-serif" }}>
                  {opt.title}
                </div>
                {opt.description && (
                  <p style={{
                    fontSize: "13px",
                    color: "#5B5B5B",
                    lineHeight: 1.5,
                    marginTop: "4px",
                    fontFamily: "Poppins, sans-serif",
                  }}>
                    {opt.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && <p style={errorTextStyle}>{error}</p>}
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
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#96237A" }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "14px",
            color: "#5B5B5B",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
          }}
        >
          S/
        </span>
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            ...(error ? inputErrorStyle : inputBaseStyle),
            paddingLeft: "40px",
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#96237A";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(150,35,122,0.1)";
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#E8E1E5";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
      {error && <p style={errorTextStyle}>{error}</p>}
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
    <div style={{ textAlign: "center", marginBottom: "40px" }}>
      {badge && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#96237A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "16px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          — {badge}
        </span>
      )}
      <h1
        style={{
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 500,
          color: "#1A1A1A",
          lineHeight: 1.2,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {title}
      </h1>
      {description && (
        <p style={{
          fontSize: "14px",
          color: "#5B5B5B",
          lineHeight: 1.7,
          maxWidth: "500px",
          margin: "16px auto 0",
          fontFamily: "Poppins, sans-serif",
        }}>
          {description}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FORM SUBMIT BUTTON
   ══════════════════════════════════════════════════ */
interface SubmitProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

export function FormSubmitButton({ text, onClick, disabled }: SubmitProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 48px",
          borderRadius: "9999px",
          backgroundColor: "#96237A",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          fontFamily: "Poppins, sans-serif",
          transition: "all 0.2s",
        }}
      >
        {text}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROW HELPER — 1-column mobile, 2-column desktop
   ══════════════════════════════════════════════════ */
export function FormRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {children}
    </div>
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
    <p
      style={{
        fontSize: size === "xs" ? "11px" : "13px",
        lineHeight: 1.6,
        color: size === "xs" ? "#9CA3AF" : "#5B5B5B",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {text}
    </p>
  );
}

/* ══════════════════════════════════════════════════
   DIVIDER — horizontal line
   ══════════════════════════════════════════════════ */
export function FormDivider() {
  return <div style={{ borderTop: "1px solid #E8E1E5", margin: "16px 0" }} />;
}

/* ══════════════════════════════════════════════════
   INLINE RADIO — horizontal radio buttons
   (like services in QuejaFormReact)
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
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: "#1A1A1A",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            marginBottom: "12px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {label} {required && <span style={{ color: "#96237A" }}>*</span>}
        </label>
      )}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {options.map((opt, i) => (
          <label
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#1A1A1A",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            <input
              type="radio"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              style={{ width: "18px", height: "18px", accentColor: "#96237A" }}
            />
            {opt.label}
          </label>
        ))}
      </div>
      {error && (
        <p
          style={{
            fontSize: "12px",
            color: "#EF4444",
            marginTop: "4px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {error}
        </p>
      )}
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
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: "#1A1A1A",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            marginBottom: "12px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {label} {required && <span style={{ color: "#96237A" }}>*</span>}
        </label>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {options.map((opt, i) => (
          <label
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#1A1A1A",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "#96237A",
                flexShrink: 0,
              }}
            />
            {opt.label}
          </label>
        ))}
      </div>
      {error && (
        <p
          style={{
            fontSize: "12px",
            color: "#EF4444",
            marginTop: "4px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DATE TRIPLET — Día / Mes / Año
   (like ApelacionFormReact date fields)
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
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${error ? "#EF4444" : "#E8E1E5"}`,
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "14px",
    color: "#1A1A1A",
    backgroundColor: "#ffffff",
    fontFamily: "Poppins, sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    textAlign: "center" as const,
  };

  return (
    <div>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: "#1A1A1A",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {label} {required && <span style={{ color: "#96237A" }}>*</span>}
        </label>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Día"
          value={value.day}
          onChange={(e) =>
            onChange({ ...value, day: e.target.value.replace(/\D/g, "").slice(0, 2) })
          }
          style={inputStyle}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#96237A";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(150,35,122,0.1)";
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#E8E1E5";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Mes"
          value={value.month}
          onChange={(e) =>
            onChange({ ...value, month: e.target.value.replace(/\D/g, "").slice(0, 2) })
          }
          style={inputStyle}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#96237A";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(150,35,122,0.1)";
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#E8E1E5";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Año"
          value={value.year}
          onChange={(e) =>
            onChange({ ...value, year: e.target.value.replace(/\D/g, "").slice(0, 4) })
          }
          style={inputStyle}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#96237A";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(150,35,122,0.1)";
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#E8E1E5";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
      {error && (
        <p
          style={{
            fontSize: "12px",
            color: "#EF4444",
            marginTop: "4px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}