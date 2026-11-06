export const FORM_PREFILL_EVENT = "fbx:prefill";

type PrefillValues = Record<string, string>;

declare global {
  interface Window {
    __fbxPendingPrefill?: PrefillValues;
  }
}

export function requestFormPrefill(values: PrefillValues) {
  window.__fbxPendingPrefill = values;
  window.dispatchEvent(new CustomEvent<PrefillValues>(FORM_PREFILL_EVENT, { detail: values }));
}

// The form island hydrates on `client:visible`, so a CTA clicked before it is on screen fires the event too early: the latest values are kept here for it to pick up on mount.
export function pendingFormPrefill(): PrefillValues | undefined {
  return typeof window === "undefined" ? undefined : window.__fbxPendingPrefill;
}

export function onFormPrefill(listener: (values: PrefillValues) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<PrefillValues>).detail || {});
  window.addEventListener(FORM_PREFILL_EVENT, handler);
  return () => window.removeEventListener(FORM_PREFILL_EVENT, handler);
}
