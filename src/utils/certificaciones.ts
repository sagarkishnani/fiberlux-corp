import client from "../../tina/__generated__/client";
import type { CertificacionesSource } from "../components/home/HomeCertificacionesReact";

export async function loadCertificaciones(): Promise<CertificacionesSource> {
  const result = await client.queries.certificaciones({ relativePath: "index.json" });
  const cert = result.data?.certificaciones as any;
  return {
    sectionTitle: cert?.sectionTitle ?? null,
    sectionTitle_en: cert?.sectionTitle_en ?? null,
    sectionDescription: cert?.sectionDescription ?? null,
    sectionDescription_en: cert?.sectionDescription_en ?? null,
    items: ((cert?.items || []).filter(Boolean) as any[]).map((c) => ({
      code: c.code ?? null,
      norm: c.norm ?? null,
      norm_en: c.norm_en ?? null,
      label: c.label ?? null,
      label_en: c.label_en ?? null,
      ringText: c.ringText ?? null,
      ringText_en: c.ringText_en ?? null,
    })),
  };
}
