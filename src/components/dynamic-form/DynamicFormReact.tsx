import { useState, useEffect, useRef } from "react";
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
  fieldHintCls,
} from "../shared/FormControls";
import { FormSuccess } from "../shared/FormSuccess";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import {
  NUMERIC_FIELD_RULES,
  isNumericField,
  sanitizeNumeric,
  isNumericValid,
  type NumericFieldType,
} from "../../utils/numericFields";

/* ══════════════════════════════════════════════════
   CLOUDFLARE TURNSTILE (captcha invisible) — SPEC 79
   Site key pública inlineada por Vite en build. La verificación real
   es server-side en send-email.php; aquí solo obtenemos el token.
   ══════════════════════════════════════════════════ */

const TURNSTILE_SITE_KEY: string =
  (import.meta as any).env?.PUBLIC_TURNSTILE_SITE_KEY || "";
const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/* Carga el script una sola vez (singleton) para todo el sitio. */
let turnstileScriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;
  turnstileScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile script failed to load"));
    document.head.appendChild(s);
  });
  return turnstileScriptPromise;
}

/* Textos por defecto de la UI del form (los que no vienen del CMS). */
const FORM_UI = {
  es: {
    sending: "Enviando...",
    submit: "Enviar",
    selectPlaceholder: "Selecciona una opción",
    required: "Este campo es obligatorio",
    invalidEmail: "Ingresa un correo válido",
    invalidFormat: "Formato inválido",
    minChars: (n: number) => `Mínimo ${n} caracteres`,
    successTitle: "¡Formulario enviado!",
    successSubtitle: "Tu solicitud ha sido registrada correctamente.",
    contactSuccessTitle: "¡Gracias por escribirnos!",
    requiredLegend: "Campos obligatorios",
    contactSuccess: "¡Gracias! Tu mensaje ha sido enviado.",
    genericError: "Ocurrió un error al enviar.",
    connError: "No se pudo conectar con el servidor.",
    captchaMissing: "Verificación de seguridad no disponible. Contacta al administrador.",
  },
  en: {
    sending: "Sending...",
    submit: "Send",
    selectPlaceholder: "Select an option",
    required: "This field is required",
    invalidEmail: "Enter a valid email",
    invalidFormat: "Invalid format",
    minChars: (n: number) => `Minimum ${n} characters`,
    successTitle: "Form submitted!",
    successSubtitle: "Your request has been registered successfully.",
    contactSuccessTitle: "Thanks for reaching out!",
    requiredLegend: "Required fields",
    contactSuccess: "Thank you! Your message has been sent.",
    genericError: "An error occurred while sending.",
    connError: "Could not connect to the server.",
    captchaMissing: "Security verification unavailable. Please contact the administrator.",
  },
} as const;

/* ══════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════ */

interface FieldOption {
  value: string;
  label: string;
  label_en?: string;
  group?: string;
  group_en?: string;
  description?: string;
  description_en?: string;
}

interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  patternMessage_en?: string;
}

interface ConditionalField {
  dependsOn: string;
  showWhen: string;
}

interface FormField {
  fieldType: string;
  name?: string;
  label?: string;
  label_en?: string;
  placeholder?: string;
  placeholder_en?: string;
  required?: boolean;
  width?: "full" | "half" | "third";
  order?: number;
  orderMobile?: number;
  sectionNumber?: number;
  noteContent?: string;
  noteContent_en?: string;
  validation?: FieldValidation;
  errorMessage?: string;
  errorMessage_en?: string;
  helpText?: string;
  helpText_en?: string;
  defaultValue?: string;
  options?: FieldOption[];
  accept?: string;
  maxFileSize?: number;
  multiple?: boolean;
  rows?: number;
  conditionalField?: ConditionalField;
  linkText?: string;
  linkText_en?: string;
  linkUrl?: string;
}

interface FormConfig {
  formId: string;
  formTitle?: string;
  formTitle_en?: string;
  badge?: string;
  description?: string;
  description_en?: string;
  styleVariant?: "default" | "contact";
  submitButtonText?: string;
  submitButtonText_en?: string;
  successTitle?: string;
  successTitle_en?: string;
  successMessage?: string;
  successMessage_en?: string;
  errorMessage?: string;
  errorMessage_en?: string;
  validationMessage?: string;
  validationMessage_en?: string;
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

function acceptsPrefill(field: FormField, value: string | undefined): value is string {
  if (!value) return false;
  if (field.fieldType !== "select" && field.fieldType !== "radio") return true;
  return (field.options || []).some((option) => option?.value === value);
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
   CHECKBOX LABEL WITH OPTIONAL LINK
   ══════════════════════════════════════════════════ */

function CheckboxLabel({ label, linkText, linkUrl }: { label: string; linkText?: string; linkUrl?: string }) {
  if (!linkText || !linkUrl) return <>{label}</>;
  const parts = label.split(linkText);
  return (
    <>
      {parts[0]}
      <a
        href={linkUrl}
        className="text-fx-purple underline underline-offset-[3px] hover:text-fx-purple-hover"
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
  /** When true, suppresses the form's internal title/description header
   *  (used when a host section — e.g. the solution hero — renders its own). */
  hideHeader?: boolean;
  /** Optional initial values keyed by field `name`. Used to pre-select fields
   *  (e.g. the "servicio" select on a sub-service page). Only applies to matching
   *  fields; when omitted the form starts with its normal defaults. */
  prefill?: Record<string, string>;
  /** Idioma activo. En 'en' usa los campos `_en` con fallback al ES. */
  locale?: Locale;
  /** Fuerza una variante visual distinta a la del CMS (p. ej. la clara del rediseño sobre una tarjeta blanca). */
  styleVariant?: FormConfig["styleVariant"];
}

export default function DynamicFormReact({ query, variables, data: initialData, hideHeader = false, prefill, locale = "es", styleVariant }: DynamicFormProps) {
  const { data } = useTina({ query, variables, data: initialData });
  const formConfig: FormConfig = data?.dynamicForms || initialData?.dynamicForms;
  if (!formConfig) return null;

  const ui = FORM_UI[locale];
  /* Localiza el `key` de un objeto (label/placeholder/etc.) según el idioma. */
  const L = (obj: any, key: string): string => tField(obj, key, locale);
  /* Opciones con label/description/group localizados (el payload sigue usando las originales). */
  const locOptions = (opts?: FieldOption[]): FieldOption[] =>
    (opts || []).map((o) => ({
      ...o,
      label: L(o, "label") || o.label,
      description: L(o, "description") || o.description,
      group: L(o, "group") || o.group,
    }));

  const fields: FormField[] = (formConfig.fields || []).filter(Boolean);
  const variant = styleVariant || formConfig.styleVariant || "default";
  const isContact = variant !== "default";

  /* ── State ── */
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) {
      if (f.name && !isStructural(f.fieldType)) {
        const prefilled = prefill?.[f.name];
        init[f.name] = acceptsPrefill(f, prefilled) ? prefilled : getDefaultValue(f);
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

  /* ── Turnstile (captcha invisible) ── */
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const captchaConfigured = !!TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!captchaConfigured) return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !captchaRef.current || widgetIdRef.current) return;
        const ts = (window as any).turnstile;
        if (!ts) return;
        widgetIdRef.current = ts.render(captchaRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          callback: (token: string) => setCaptchaToken(token),
          "error-callback": () => setCaptchaToken(""),
          "expired-callback": () => setCaptchaToken(""),
        });
      })
      .catch(() => {
        /* Script bloqueado/caído → token vacío; el backend rechaza (fail-closed). */
      });
    return () => {
      cancelled = true;
      const ts = (window as any).turnstile;
      if (ts && widgetIdRef.current) {
        try { ts.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, []);

  /* Resetea el widget para forzar un token nuevo (los tokens son de un solo uso). */
  const resetCaptcha = () => {
    const ts = (window as any).turnstile;
    if (ts && widgetIdRef.current) {
      try { ts.reset(widgetIdRef.current); } catch { /* ignore */ }
    }
    setCaptchaToken("");
  };

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

  const prefillKey = JSON.stringify(prefill || {});
  const appliedPrefillKey = useRef(prefillKey);
  useEffect(() => {
    if (appliedPrefillKey.current === prefillKey) return;
    appliedPrefillKey.current = prefillKey;
    const updates: Record<string, string> = {};
    for (const f of fields) {
      const prefilled = f.name ? prefill?.[f.name] : undefined;
      if (f.name && acceptsPrefill(f, prefilled)) updates[f.name] = prefilled;
    }
    if (Object.keys(updates).length) setValues((prev) => ({ ...prev, ...updates }));
  }, [prefillKey]);

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
          errs[field.name] = L(field, "errorMessage") || ui.required;
          continue;
        }
      }

      /* Numérico (tel/ruc): longitud exacta + prefijo desde código (SPEC 84).
       * Las reglas de código pisan el pattern/minLength del JSON para estos tipos.
       * Si no es required y está vacío, ya pasó el bloque anterior sin error. */
      if (isNumericField(field.fieldType)) {
        if (val && typeof val === "string" && val.trim() && !isNumericValid(val, field.fieldType)) {
          errs[field.name] = L(field, "errorMessage") || NUMERIC_FIELD_RULES[field.fieldType].message;
        }
        continue;
      }

      /* Email */
      if (field.fieldType === "email" && val && typeof val === "string" && val.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
          errs[field.name] = L(field, "errorMessage") || ui.invalidEmail;
        }
      }

      /* Pattern */
      if (field.validation?.pattern && val && typeof val === "string") {
        try {
          if (!new RegExp(field.validation.pattern).test(val)) {
            errs[field.name] =
              tField(field.validation, "patternMessage", locale) || L(field, "errorMessage") || ui.invalidFormat;
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
            L(field, "errorMessage") || ui.minChars(field.validation.minLength);
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
      setSendError(L(formConfig, "validationMessage") || "");
      return;
    }

    /* Sin site key configurada no se puede verificar el captcha → no se envía. */
    if (!captchaConfigured) {
      setSendError(ui.captchaMissing);
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
        captchaToken,
      });

      if (result.success) {
        setCorrelativo(result.correlativo || "");
        setSubmitted(true);
      } else {
        setSendError(
          result.error || L(formConfig, "errorMessage") || ui.genericError
        );
      }
    } catch {
      setSendError(
        L(formConfig, "errorMessage") || ui.connError
      );
    } finally {
      setSending(false);
      /* Token de un solo uso: pedir uno nuevo para el próximo intento. */
      resetCaptcha();
    }
  };

  /* ══════════════════════════════════════════════════
     SUCCESS STATE
     ══════════════════════════════════════════════════ */

  if (submitted) {
    return (
      <FormSuccess
        compact={isContact}
        title={L(formConfig, "successTitle") || (isContact ? ui.contactSuccessTitle : ui.successTitle)}
        subtitle={L(formConfig, "successMessage") || (isContact ? ui.contactSuccess : ui.successSubtitle)}
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
            <h3 className="m-0 pt-2 text-[16px] font-semibold text-fx-purple">{L(field, "label")}</h3>
          ) : (
            <FormSectionHeader number={field.sectionNumber || 1} title={L(field, "label")} />
          )}
        </div>
      );
    }

    if (field.fieldType === "divider") return <FormDivider />;

    if (field.fieldType === "note") {
      return (
        <div data-tina-field={tinaField(formConfig, "fields", fieldIndex, "noteContent")}>
          <FormNote text={L(field, "noteContent")} />
        </div>
      );
    }

    /* --- Hidden --- */
    if (field.fieldType === "hidden") return null;

    /* --- Input types --- */
    const name = field.name!;
    const label = L(field, "label");
    const placeholder = L(field, "placeholder");
    const required = !!field.required;
    const fieldOptions = locOptions(field.options);
    const selectPlaceholder = placeholder || ui.selectPlaceholder;

    /* Reglas numéricas (tel/ruc): filtrado, longitud e inputMode desde código (SPEC 84).
     * numOnChange sirve también a los tipos no numéricos (cae al slice por maxLen). */
    const numType: NumericFieldType | null = isNumericField(field.fieldType) ? field.fieldType : null;
    const numMaxLen = numType ? NUMERIC_FIELD_RULES[numType].length : maxLen;
    const numInputMode: "numeric" | undefined = numType ? "numeric" : undefined;
    const numOnChange = (v: string) =>
      updateField(name, numType ? sanitizeNumeric(v, numType) : maxLen ? v.slice(0, maxLen) : v);

    if (field.fieldType === "text" || field.fieldType === "tel" || field.fieldType === "number" || field.fieldType === "email" || field.fieldType === "ruc") {
      return (
        <FormInput
          label={label}
          placeholder={placeholder}
          type={
            field.fieldType === "email"
              ? "email"
              : numType
              ? "tel"
              : field.fieldType === "number"
              ? "number"
              : "text"
          }
          inputMode={numInputMode}
          value={val || ""}
          onChange={numOnChange}
          required={required}
          maxLength={numMaxLen}
          error={err}
        />
      );
    }

    if (field.fieldType === "select") {
      return (
        <FormSelect
          label={label}
          placeholder={selectPlaceholder}
          options={fieldOptions}
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
              linkText={L(field, "linkText")}
              linkUrl={field.linkUrl}
            />
          </span>
        </FormCheckbox>
      );
    }

    if (field.fieldType === "checkboxGroup") {
      return (
        <FormCheckboxGroup
          label={label}
          options={fieldOptions}
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
          options={fieldOptions}
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
          options={fieldOptions.map((o) => ({
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
          helpText={L(field, "helpText")}
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
  const gridCls = `df-grid-${formId}`;

  type IndexedField = { field: FormField; idx: number };
  const visibleFields: IndexedField[] = sortedFields
    .map((field, idx) => ({ field, idx }))
    .filter(({ field }) => isFieldVisible(field));

  /* Variante por defecto: cada section_header abre una tarjeta propia (fieldset del prototipo Legal). */
  const sections: { header?: IndexedField; items: IndexedField[] }[] = [];
  for (const entry of visibleFields) {
    if (!isContact && entry.field.fieldType === "section_header") {
      sections.push({ header: entry, items: [] });
    } else {
      if (!sections.length) sections.push({ items: [] });
      sections[sections.length - 1].items.push(entry);
    }
  }

  const renderCell = ({ field, idx }: IndexedField, position: number) => {
    const w = isStructural(field.fieldType) ? "full" : (field.width || "full");
    const orderVal = isMobile ? (field.orderMobile ?? field.order ?? 0) : (field.order ?? 0);
    const needsTopSpacing = isContact && ["section_header", "divider"].includes(field.fieldType) && position > 0;
    return (
      <div
        key={field.name || `struct-${idx}`}
        className={`${widthClass(w)} min-w-0 ${needsTopSpacing ? "pt-4" : ""}`}
        style={{ order: orderVal || undefined }}
      >
        {renderField(field, idx)}
        {L(field, "helpText") && !["upload", "note"].includes(field.fieldType) && (
          <p className={fieldHintCls}>{L(field, "helpText")}</p>
        )}
      </div>
    );
  };

  const submitText = sending ? ui.sending : (L(formConfig, "submitButtonText") || ui.submit);

  const antiSpam = (
    <>
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {/* Cloudflare Turnstile — captcha invisible (interaction-only). Con esta
          apariencia el widget mide 0px y es invisible para usuarios legítimos;
          solo se expande para mostrar un reto ante señales de bot, por lo que
          va en el flujo (no display:none) para poder renderizarlo si hace falta. */}
      <div ref={captchaRef} />
    </>
  );

  const errorMessage = sendError && <p className="m-0 text-center text-[13px] text-[#C81D87]">{sendError}</p>;

  const gridStyles = (
    <style>{`
      .${gridCls} {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: ${isContact ? "16px" : "20px"};
      }
      .${gridCls} .df-full  { grid-column: span 6; }
      .${gridCls} .df-half  { grid-column: span 3; }
      .${gridCls} .df-third { grid-column: span 2; }
      @media (max-width: 768px) {
        .${gridCls} .df-half,
        .${gridCls} .df-third { grid-column: span 6; }
        .${gridCls} { gap: 16px; }
      }
    `}</style>
  );

  if (isContact) {
    return (
      <div className="flex flex-col gap-5">
        {gridStyles}
        {!hideHeader && (L(formConfig, "formTitle") || L(formConfig, "description")) && (
          <div>
            {L(formConfig, "formTitle") && (
              <h2
                className="m-0 text-[28px] font-medium leading-[1.1] tracking-[-.025em] text-fx-purple lg:text-[34px]"
                data-tina-field={tinaField(formConfig, "formTitle")}
              >
                {L(formConfig, "formTitle")}
              </h2>
            )}
            {L(formConfig, "description") && (
              <p className="mb-1.5 mt-2 text-[15px] leading-[1.6] text-fx-body" data-tina-field={tinaField(formConfig, "description")}>
                {L(formConfig, "description")}
              </p>
            )}
          </div>
        )}
        <div className={gridCls}>{visibleFields.map(renderCell)}</div>
        {antiSpam}
        <FormSubmitButton text={submitText} onClick={handleSubmit} disabled={sending} className="mt-2 !h-[60px] w-full" />
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {gridStyles}
      {!hideHeader && (formConfig.badge || formConfig.formTitle || formConfig.description) && (
        <div data-tina-field={tinaField(formConfig, "formTitle")}>
          <FormPageHeader badge={formConfig.badge} title={L(formConfig, "formTitle")} description={L(formConfig, "description")} />
        </div>
      )}

      {sections.map((section, si) => (
        <fieldset key={si} className="m-0 min-w-0 rounded-[24px] border border-fx-line bg-white px-5 py-7 lg:rounded-[28px] lg:px-11 lg:py-10">
          {section.header && <div className="mb-6 lg:mb-7">{renderField(section.header.field, section.header.idx)}</div>}
          <div className={gridCls}>{section.items.map(renderCell)}</div>
        </fieldset>
      ))}

      {antiSpam}

      <div className="flex flex-col-reverse items-stretch gap-4 rounded-[24px] border border-fx-line bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:rounded-[28px] lg:px-11 lg:py-7">
        <span className="text-center text-[13px] text-fx-muted sm:text-left">
          <span className="text-[#C81D87]">*</span> {ui.requiredLegend}
        </span>
        <FormSubmitButton text={submitText} onClick={handleSubmit} disabled={sending} />
      </div>
      {errorMessage}
    </div>
  );
}
