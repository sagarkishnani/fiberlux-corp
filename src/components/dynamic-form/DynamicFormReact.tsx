import { useState, useEffect } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import {
  FormPageHeader,
  FormSectionHeader,
  FormInput,
  FormSelect,
  FormTextarea,
  FormFileUpload,
  FormCheckbox,
  FormRadioGroup,
  FormCurrency,
  FormSubmitButton,
  FormNote,
  FormDivider,
  FormInlineRadio,
  FormCheckboxGroup,
  FormDateTriplet,
} from "../shared/FormControls";
import { FormSuccess } from "../shared/FormSuccess";

/* ══════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════ */

interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

interface ConditionalField {
  dependsOn: string;
  showWhen: string;
}

interface FormField {
  fieldType: string;
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  width?: "full" | "half" | "third";
  order?: number;
  orderMobile?: number;
  sectionNumber?: number;
  noteContent?: string;
  validation?: FieldValidation;
  errorMessage?: string;
  helpText?: string;
  defaultValue?: string;
  options?: FieldOption[];
  accept?: string;
  maxFileSize?: number;
  multiple?: boolean;
  rows?: number;
  conditionalField?: ConditionalField;
  linkText?: string;
  linkUrl?: string;
}

interface FormConfig {
  formId: string;
  formTitle?: string;
  badge?: string;
  description?: string;
  styleVariant?: "default" | "contact" | "contact-dark";
  submitButtonText?: string;
  successTitle?: string;
  successMessage?: string;
  errorMessage?: string;
  validationMessage?: string;
  showCorrelativo?: boolean;
  privacyText?: string;
  privacyUrl?: string;
  dataUrl?: string;
  fields?: FormField[];
}

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */

const STRUCTURAL_TYPES = ["section_header", "divider", "note"];

function isStructural(type: string): boolean {
  return STRUCTURAL_TYPES.includes(type);
}

function getDefaultValue(field: FormField): any {
  if (field.defaultValue !== undefined && field.defaultValue !== "") return field.defaultValue;
  switch (field.fieldType) {
    case "checkbox":
      return false;
    case "checkboxGroup":
      return [];
    case "upload":
      return [];
    case "date":
      return { day: "", month: "", year: "" };
    default:
      return "";
  }
}

/* ══════════════════════════════════════════════════
   CONTACT VARIANT — Tailwind-based controls
   (Matches the existing ContactFormReact styles)
   ══════════════════════════════════════════════════ */

const contactLabelCls =
  "block text-caption-sm font-semibold text-greyscale-darkest tracking-wider uppercase mb-2";
const contactInputCls =
  "w-full border rounded-xl px-4 py-3.5 text-body-sm text-greyscale-darkest placeholder:text-greyscale-medium focus:outline-none focus:ring-1 transition-all bg-greyscale-white";
const contactInputOk = "border-greyscale-light focus:border-brand-purple focus:ring-brand-purple/20";
const contactInputErr = "border-red-400 focus:border-red-400 focus:ring-red-400/20";
const contactErrorCls = "text-caption-sm text-red-500 mt-1";

/* Dark (corp) class sets — used by styleVariant "contact-dark" */
const contactLabelDarkCls =
  "block text-caption-sm font-medium text-greyscale-light mb-2";
const contactInputDarkCls =
  "w-full border rounded-xl px-4 py-3.5 text-body-sm text-greyscale-white placeholder:text-greyscale-medium focus:outline-none focus:ring-1 transition-all bg-white/[0.04]";
const contactInputDarkOk = "border-white/10 focus:border-brand-purple focus:ring-brand-purple/30";
const contactInputDarkErr = "border-red-400/70 focus:border-red-400 focus:ring-red-400/20";

/* Resolve the class set for the active contact theme */
function contactCls(dark?: boolean) {
  return {
    label: dark ? contactLabelDarkCls : contactLabelCls,
    input: dark ? contactInputDarkCls : contactInputCls,
    ok: dark ? contactInputDarkOk : contactInputOk,
    err: dark ? contactInputDarkErr : contactInputErr,
  };
}

function ContactInput({
  label, placeholder, type = "text", value, onChange, required, maxLength, error, dark,
}: {
  label: string; placeholder?: string; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; maxLength?: number; error?: string; dark?: boolean;
}) {
  const c = contactCls(dark);
  return (
    <div>
      {label && (
        <label className={c.label}>
          {label} {required && <span className="text-brand-purple">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        maxLength={maxLength}
        className={`${c.input} ${error ? c.err : c.ok}`}
      />
      {error && <p className={contactErrorCls}>{error}</p>}
    </div>
  );
}

function ContactSelect({
  label, placeholder, options, value, onChange, required, error, dark,
}: {
  label: string; placeholder?: string; options: FieldOption[]; value: string;
  onChange: (v: string) => void; required?: boolean; error?: string; dark?: boolean;
}) {
  const c = contactCls(dark);
  const arrowColor = dark ? "%23B0B0B0" : "%236B7280";
  return (
    <div>
      {label && (
        <label className={c.label}>
          {label} {required && <span className="text-brand-purple">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${c.input} appearance-none ${dark && !value ? "text-greyscale-medium" : ""} ${error ? c.err : c.ok}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${arrowColor}' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          backgroundSize: "12px",
        }}
      >
        <option value="" disabled>
          {placeholder || "Selecciona una opción"}
        </option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value} className="text-greyscale-darkest">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className={contactErrorCls}>{error}</p>}
    </div>
  );
}

function ContactTextarea({
  label, placeholder, value, onChange, rows = 4, required, maxLength, error, dark,
}: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void;
  rows?: number; required?: boolean; maxLength?: number; error?: string; dark?: boolean;
}) {
  const c = contactCls(dark);
  return (
    <div>
      {label && (
        <label className={c.label}>
          {label} {required && <span className="text-brand-purple">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className={`${c.input} resize-none ${error ? c.err : c.ok}`}
      />
      <div className="flex justify-between mt-1">
        {error ? <p className={contactErrorCls}>{error}</p> : <span />}
        {maxLength && (
          <span className="text-caption-sm text-greyscale-medium">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

function ContactCheckbox({
  checked, onChange, children, error, dark,
}: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; error?: string; dark?: boolean;
}) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`mt-1 w-4 h-4 accent-brand-purple rounded ${dark ? "border-white/20" : "border-greyscale-light"}`}
        />
        <span className={`text-caption-sm leading-relaxed ${dark ? "text-greyscale-light" : "text-greyscale-dark"}`}>{children}</span>
      </label>
      {error && <p className="text-caption-sm text-red-500 mt-1 ml-7">{error}</p>}
    </div>
  );
}

function ContactSubmitButton({
  text, onClick, disabled, dark,
}: {
  text: string; onClick: () => void; disabled?: boolean; dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl text-greyscale-white text-body-md font-semibold transition-all ${
        disabled
          ? "bg-brand-purple/60 cursor-not-allowed"
          : dark
          ? "bg-gradient-to-r from-brand-purple to-brand-purple-dark hover:from-brand-purple-dark hover:to-brand-purple-darkest active:scale-[0.99]"
          : "bg-brand-purple hover:bg-brand-purple-dark active:scale-[0.99]"
      }`}
    >
      {text}
    </button>
  );
}

/* ══════════════════════════════════════════════════
   CHECKBOX LABEL WITH OPTIONAL LINK
   ══════════════════════════════════════════════════ */

function CheckboxLabel({
  label,
  linkText,
  linkUrl,
  variant,
}: {
  label: string;
  linkText?: string;
  linkUrl?: string;
  variant: "contact" | "contact-dark" | "default";
}) {
  if (!linkText || !linkUrl) return <>{label}</>;

  const parts = label.split(linkText);

  const linkStyle =
    variant === "default"
      ? { color: "#96237A", textDecoration: "underline" }
      : undefined;

  const linkClass =
    variant === "contact"
      ? "text-brand-purple underline hover:text-brand-purple-dark"
      : variant === "contact-dark"
      ? "text-[#D070B8] underline hover:text-[#E693CE]"
      : undefined;

  return (
    <>
      {parts[0]}
      <a
        href={linkUrl}
        style={linkStyle}
        className={linkClass}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkText}
      </a>
      {parts[1] || ""}
    </>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */

interface DynamicFormProps {
  query: string;
  variables: { relativePath: string };
  data: any;
}

export default function DynamicFormReact({ query, variables, data: initialData }: DynamicFormProps) {
  const { data } = useTina({ query, variables, data: initialData });
  const formConfig: FormConfig = data?.dynamicForms || initialData?.dynamicForms;
  if (!formConfig) return null;

  const fields: FormField[] = (formConfig.fields || []).filter(Boolean);
  const variant = formConfig.styleVariant || "default";
  const isDark = variant === "contact-dark";
  const isContact = variant === "contact" || isDark;

  /* ── State ── */
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) {
      if (f.name && !isStructural(f.fieldType)) {
        init[f.name] = getDefaultValue(f);
      }
    }
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [correlativo, setCorrelativo] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Pre-select from URL params (e.g., ?servicio=internet_fibra) */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      for (const f of fields) {
        if (f.name && params.has(f.name)) {
          const paramVal = params.get(f.name);
          if (paramVal) setValues((prev) => ({ ...prev, [f.name!]: paramVal }));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Helpers ── */
  const updateField = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const isFieldVisible = (field: FormField): boolean => {
    if (!field.conditionalField?.dependsOn) return true;
    const depVal = values[field.conditionalField.dependsOn];
    if (field.conditionalField.showWhen === "true") return !!depVal;
    if (field.conditionalField.showWhen === "false") return !depVal;
    return String(depVal) === field.conditionalField.showWhen;
  };

  /* ── Validation ── */
  const validateForm = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    for (const field of fields) {
      if (!field.name || isStructural(field.fieldType)) continue;
      if (!isFieldVisible(field)) continue;

      const val = values[field.name];

      /* Required */
      if (field.required) {
        let isEmpty = false;
        if (field.fieldType === "checkbox") isEmpty = !val;
        else if (field.fieldType === "upload") isEmpty = !val || val.length === 0;
        else if (field.fieldType === "checkboxGroup") isEmpty = !val || val.length === 0;
        else if (field.fieldType === "date") isEmpty = !val?.day || !val?.month || !val?.year;
        else isEmpty = val === undefined || val === null || val === "" || (typeof val === "string" && !val.trim());

        if (isEmpty) {
          errs[field.name] = field.errorMessage || "Este campo es obligatorio";
          continue;
        }
      }

      /* Email */
      if (field.fieldType === "email" && val && typeof val === "string" && val.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
          errs[field.name] = field.errorMessage || "Ingresa un correo válido";
        }
      }

      /* Pattern */
      if (field.validation?.pattern && val && typeof val === "string") {
        try {
          if (!new RegExp(field.validation.pattern).test(val)) {
            errs[field.name] =
              field.validation.patternMessage || field.errorMessage || "Formato inválido";
          }
        } catch {
          /* invalid regex — skip */
        }
      }

      /* Min length */
      if (
        field.validation?.minLength &&
        val &&
        typeof val === "string" &&
        val.length < field.validation.minLength
      ) {
        if (!errs[field.name]) {
          errs[field.name] =
            field.errorMessage || `Mínimo ${field.validation.minLength} caracteres`;
        }
      }
    }

    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setTouched(true);
    setSendError("");

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSendError(formConfig.validationMessage || "");
      return;
    }

    setSending(true);
    try {
      const { submitForm } = await import("../../utils/submitForm");

      const textData: Record<string, string> = {};
      const fileData: Record<string, File[]> = {};

      for (const field of fields) {
        if (!field.name || isStructural(field.fieldType)) continue;
        if (!isFieldVisible(field)) continue;

        const val = values[field.name];

        if (field.fieldType === "upload") {
          if (val && val.length > 0) fileData[field.name] = val;
        } else if (field.fieldType === "checkbox") {
          textData[field.name] = String(!!val);
        } else if (field.fieldType === "checkboxGroup") {
          textData[field.name] = (val || []).join(", ");
        } else if (field.fieldType === "date") {
          textData[field.name] = val ? `${val.day}/${val.month}/${val.year}` : "";
        } else if (
          (field.fieldType === "select" ||
            field.fieldType === "radio" ||
            field.fieldType === "radioGroup") &&
          field.options
        ) {
          const opt = field.options.find((o) => o.value === val);
          textData[field.name] = opt?.label || String(val || "");
        } else {
          textData[field.name] = String(val || "");
        }
      }

      const result = await submitForm({
        formType: formConfig.formId,
        data: textData,
        files: Object.keys(fileData).length > 0 ? fileData : undefined,
        honeypot,
      });

      if (result.success) {
        setCorrelativo(result.correlativo || "");
        setSubmitted(true);
      } else {
        setSendError(
          result.error || formConfig.errorMessage || "Ocurrió un error al enviar."
        );
      }
    } catch {
      setSendError(
        formConfig.errorMessage || "No se pudo conectar con el servidor."
      );
    } finally {
      setSending(false);
    }
  };

  /* ══════════════════════════════════════════════════
     SUCCESS STATE
     ══════════════════════════════════════════════════ */

  if (submitted) {
    if (isContact) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-semantics-success/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className={`text-subtitle-sm font-semibold ${isDark ? "text-greyscale-white" : "text-greyscale-darkest"}`}>
              {formConfig.successMessage || "¡Gracias! Tu mensaje ha sido enviado."}
            </p>
          </div>
        </div>
      );
    }

    return (
      <FormSuccess
        title={formConfig.successTitle || "¡Formulario enviado!"}
        subtitle={formConfig.successMessage || "Tu solicitud ha sido registrada correctamente."}
        correlativo={formConfig.showCorrelativo ? correlativo : undefined}
      />
    );
  }

  /* ══════════════════════════════════════════════════
     SORT FIELDS BY ORDER
     ══════════════════════════════════════════════════ */

  const sortedFields = [...fields].sort((a, b) => {
    const orderA = isMobile ? (a.orderMobile ?? a.order ?? 0) : (a.order ?? 0);
    const orderB = isMobile ? (b.orderMobile ?? b.order ?? 0) : (b.order ?? 0);
    return orderA - orderB;
  });

  /* ══════════════════════════════════════════════════
     RENDER A SINGLE FIELD
     ══════════════════════════════════════════════════ */

  function renderField(field: FormField, fieldIndex: number) {
    const val = field.name ? values[field.name] : undefined;
    const err = field.name && touched ? errors[field.name] : undefined;
    const maxLen = field.validation?.maxLength;

    /* --- Structural types --- */

    if (field.fieldType === "section_header") {
      return (
        <div data-tina-field={tinaField(formConfig, "fields", fieldIndex, "label")}>
          {isContact ? (
            <h3 className={`text-body-md font-bold mt-4 mb-2 ${isDark ? "text-greyscale-white" : "text-greyscale-darkest"}`}>
              {field.label}
            </h3>
          ) : (
            <FormSectionHeader number={field.sectionNumber || 1} title={field.label || ""} />
          )}
        </div>
      );
    }

    if (field.fieldType === "divider") {
      return isContact ? (
        <div className={`border-t ${isDark ? "border-white/10" : "border-greyscale-light"}`} />
      ) : (
        <FormDivider />
      );
    }

    if (field.fieldType === "note") {
      return (
        <div data-tina-field={tinaField(formConfig, "fields", fieldIndex, "noteContent")}>
          {isContact ? (
            <p className="text-caption-sm text-greyscale-medium leading-relaxed">
              {field.noteContent}
            </p>
          ) : (
            <FormNote text={field.noteContent || ""} />
          )}
        </div>
      );
    }

    /* --- Hidden --- */
    if (field.fieldType === "hidden") return null;

    /* --- Input types --- */
    const name = field.name!;
    const label = field.label || "";
    const placeholder = field.placeholder || "";
    const required = !!field.required;

    if (isContact) {
      /* ════ CONTACT VARIANT ════ */

      if (field.fieldType === "text" || field.fieldType === "tel" || field.fieldType === "number") {
        return (
          <ContactInput
            label={label}
            placeholder={placeholder}
            type={field.fieldType === "tel" ? "tel" : field.fieldType === "number" ? "number" : "text"}
            value={val || ""}
            onChange={(v) => updateField(name, maxLen ? v.slice(0, maxLen) : v)}
            required={required}
            maxLength={maxLen}
            error={err}
            dark={isDark}
          />
        );
      }

      if (field.fieldType === "email") {
        return (
          <ContactInput
            label={label}
            placeholder={placeholder}
            type="email"
            value={val || ""}
            onChange={(v) => updateField(name, v)}
            required={required}
            error={err}
            dark={isDark}
          />
        );
      }

      if (field.fieldType === "select") {
        return (
          <ContactSelect
            label={label}
            placeholder={placeholder}
            options={field.options || []}
            value={val || ""}
            onChange={(v) => updateField(name, v)}
            required={required}
            error={err}
            dark={isDark}
          />
        );
      }

      if (field.fieldType === "textarea") {
        return (
          <ContactTextarea
            label={label}
            placeholder={placeholder}
            value={val || ""}
            onChange={(v) => updateField(name, v)}
            rows={field.rows || 4}
            required={required}
            maxLength={maxLen}
            error={err}
            dark={isDark}
          />
        );
      }

      if (field.fieldType === "checkbox") {
        return (
          <ContactCheckbox
            checked={!!val}
            onChange={(v) => updateField(name, v)}
            error={err}
            dark={isDark}
          >
            <span data-tina-field={tinaField(formConfig, "fields", fieldIndex, "label")}>
              <CheckboxLabel
                label={label}
                linkText={field.linkText}
                linkUrl={field.linkUrl}
                variant={isDark ? "contact-dark" : "contact"}
              />
            </span>
          </ContactCheckbox>
        );
      }

      /* Fallback for other types in contact variant — use default controls */
    }

    /* ════ DEFAULT VARIANT (inline styles) ════ */

    if (field.fieldType === "text" || field.fieldType === "tel" || field.fieldType === "number" || field.fieldType === "email") {
      return (
        <FormInput
          label={label}
          placeholder={placeholder}
          type={
            field.fieldType === "email"
              ? "email"
              : field.fieldType === "tel"
              ? "tel"
              : field.fieldType === "number"
              ? "number"
              : "text"
          }
          value={val || ""}
          onChange={(v) => updateField(name, maxLen ? v.slice(0, maxLen) : v)}
          required={required}
          maxLength={maxLen}
          error={err}
        />
      );
    }

    if (field.fieldType === "select") {
      return (
        <FormSelect
          label={label}
          placeholder={placeholder}
          options={field.options || []}
          value={val || ""}
          onChange={(v) => updateField(name, v)}
          required={required}
          error={err}
        />
      );
    }

    if (field.fieldType === "textarea") {
      return (
        <FormTextarea
          label={label}
          placeholder={placeholder}
          value={val || ""}
          onChange={(v) => updateField(name, v)}
          rows={field.rows || 4}
          required={required}
          maxLength={maxLen}
          error={err}
        />
      );
    }

    if (field.fieldType === "checkbox") {
      return (
        <FormCheckbox checked={!!val} onChange={(v) => updateField(name, v)} error={err}>
          <span data-tina-field={tinaField(formConfig, "fields", fieldIndex, "label")}>
            <CheckboxLabel
              label={label}
              linkText={field.linkText}
              linkUrl={field.linkUrl}
              variant="default"
            />
          </span>
        </FormCheckbox>
      );
    }

    if (field.fieldType === "checkboxGroup") {
      return (
        <FormCheckboxGroup
          label={label}
          options={field.options || []}
          value={val || []}
          onChange={(v) => updateField(name, v)}
          required={required}
          error={err}
        />
      );
    }

    if (field.fieldType === "radio") {
      return (
        <FormInlineRadio
          label={label}
          options={field.options || []}
          value={val || ""}
          onChange={(v) => updateField(name, v)}
          required={required}
          error={err}
        />
      );
    }

    if (field.fieldType === "radioGroup") {
      return (
        <FormRadioGroup
          label={label}
          options={(field.options || []).map((o) => ({
            value: o.value,
            title: o.label,
            description: o.description,
          }))}
          value={val || ""}
          onChange={(v) => updateField(name, v)}
          required={required}
          error={err}
        />
      );
    }

    if (field.fieldType === "upload") {
      return (
        <FormFileUpload
          label={label}
          files={val || []}
          onChange={(v) => updateField(name, v)}
          accept={field.accept}
          multiple={field.multiple !== false}
          required={required}
          error={err}
          helpText={field.helpText}
        />
      );
    }

    if (field.fieldType === "currency") {
      return (
        <FormCurrency
          label={label}
          value={val || ""}
          onChange={(v) => updateField(name, v)}
          required={required}
          error={err}
          placeholder={placeholder}
        />
      );
    }

    if (field.fieldType === "date") {
      return (
        <FormDateTriplet
          label={label}
          value={val || { day: "", month: "", year: "" }}
          onChange={(v) => updateField(name, v)}
          required={required}
          error={err}
        />
      );
    }

    return null;
  }

  /* ══════════════════════════════════════════════════
     RENDER FORM
     ══════════════════════════════════════════════════ */

  const widthClass = (w?: string) =>
    w === "third" ? "df-third" : w === "half" ? "df-half" : "df-full";

  const formId = formConfig.formId || "dynamic-form";

  return (
    <div>
      {/* Scoped grid styles */}
      <style>{`
        .df-grid-${formId} {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px 16px;
        }
        .df-grid-${formId} .df-full  { grid-column: span 6; }
        .df-grid-${formId} .df-half  { grid-column: span 3; }
        .df-grid-${formId} .df-third { grid-column: span 2; }
        @media (max-width: 768px) {
          .df-grid-${formId} .df-half,
          .df-grid-${formId} .df-third { grid-column: span 6; }
          .df-grid-${formId} { gap: 14px; }
        }
      `}</style>

      {/* Page header — only for default variant */}
      {!isContact && (formConfig.badge || formConfig.formTitle || formConfig.description) && (
        <div data-tina-field={tinaField(formConfig, "formTitle")}>
          <FormPageHeader
            badge={formConfig.badge}
            title={formConfig.formTitle || ""}
            description={formConfig.description}
          />
        </div>
      )}

      {/* Contact variant: title (and subtitle for dark) inside the form area */}
      {isContact && (formConfig.formTitle || (isDark && formConfig.description)) && (
        <div className="mb-8">
          {formConfig.formTitle && (
            <h2
              className={`text-subtitle-md font-bold! ${isDark ? "text-greyscale-white mb-2" : "text-greyscale-darkest"}`}
              data-tina-field={tinaField(formConfig, "formTitle")}
            >
              {formConfig.formTitle}
            </h2>
          )}
          {isDark && formConfig.description && (
            <p
              className="text-body-sm text-greyscale-light"
              data-tina-field={tinaField(formConfig, "description")}
            >
              {formConfig.description}
            </p>
          )}
        </div>
      )}

      {/* Fields grid */}
      <div className={`df-grid-${formId}`}>
        {sortedFields.map((field, idx) => {
          if (!isFieldVisible(field)) return null;

          /* Structural types always full width */
          const w = isStructural(field.fieldType) ? "full" : (field.width || "full");
          const orderVal = isMobile
            ? (field.orderMobile ?? field.order ?? 0)
            : (field.order ?? 0);

          const isSection = field.fieldType === "section_header";
          const isDivider = field.fieldType === "divider";
          const needsTopSpacing = (isSection || isDivider) && idx > 0;

          return (
            <div
              key={field.name || `struct-${idx}`}
              className={widthClass(w)}
              style={{
                order: orderVal || undefined,
                paddingTop: needsTopSpacing ? "32px" : undefined,
              }}
            >
              {renderField(field, idx)}
              {field.helpText && !["upload", "note"].includes(field.fieldType) && (
                <p
                  style={
                    isContact
                      ? undefined
                      : { fontSize: "12px", color: "#9CA3AF", marginTop: "4px", fontFamily: "Poppins, sans-serif" }
                  }
                  className={isContact ? "text-caption-sm text-greyscale-medium mt-1" : undefined}
                >
                  {field.helpText}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Honeypot */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {/* Submit */}
      <div style={{ marginTop: "24px" }}>
        {isContact ? (
          <ContactSubmitButton
            text={sending ? "Enviando..." : (formConfig.submitButtonText || "Enviar")}
            onClick={handleSubmit}
            disabled={sending}
            dark={isDark}
          />
        ) : (
          <FormSubmitButton
            text={sending ? "Enviando..." : (formConfig.submitButtonText || "Enviar")}
            onClick={handleSubmit}
            disabled={sending}
          />
        )}
      </div>

      {/* Error / validation message */}
      {sendError && (
        <p
          style={
            isContact
              ? undefined
              : { textAlign: "center", color: "#EF4444", fontSize: "13px", marginTop: "8px", fontFamily: "Poppins, sans-serif" }
          }
          className={isContact ? "text-caption-sm text-red-500 text-center mt-2" : undefined}
        >
          {sendError}
        </p>
      )}
    </div>
  );
}