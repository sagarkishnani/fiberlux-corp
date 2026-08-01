/**
 * Reglas de validación numérica compartidas (SPEC 84).
 *
 * `tel` y `ruc` dejan de ser un `type` cosmético del <input>: filtran a solo
 * dígitos al escribir/pegar, tienen longitud exacta y (para `tel`) un prefijo
 * obligatorio. Las reglas viven aquí para que no existan dos definiciones de la
 * misma regla entre el motor de formularios y cualquier otro consumidor.
 */

export const NUMERIC_FIELD_RULES = {
  tel: { length: 9, startsWith: "9", message: "El teléfono debe tener 9 dígitos y empezar en 9" },
  ruc: { length: 11, startsWith: null, message: "El RUC debe tener 11 dígitos" },
} as const;

export type NumericFieldType = keyof typeof NUMERIC_FIELD_RULES;

/** Type guard: ¿este fieldType tiene reglas numéricas de código? */
export function isNumericField(type: string): type is NumericFieldType {
  return type === "tel" || type === "ruc";
}

/** Deja solo dígitos y trunca a la longitud del tipo. */
export function sanitizeNumeric(value: string, type: NumericFieldType): string {
  return value.replace(/\D/g, "").slice(0, NUMERIC_FIELD_RULES[type].length);
}

/** Longitud exacta + prefijo obligatorio (si el tipo lo define). */
export function isNumericValid(value: string, type: NumericFieldType): boolean {
  const rule = NUMERIC_FIELD_RULES[type];
  if (value.length !== rule.length) return false;
  if (rule.startsWith && !value.startsWith(rule.startsWith)) return false;
  return true;
}
