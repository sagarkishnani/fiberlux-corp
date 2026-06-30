import client from "../../tina/__generated__/client";

export async function getStaticPaths() {
  return [{ params: {} }];
}

export async function GET() {
  let config: any = { forms: [] };

  try {
    const result = await client.queries.formConfig({ relativePath: "index.json" });
    const data = result?.data?.formConfig;
    if (data?.forms) {
      config.forms = data.forms.filter(Boolean).map((f: any) => ({
        formType: f.formType || "",
        label: f.label || "",
        enabled: f.enabled !== false,
        recipients: (f.recipients || []).filter(Boolean),
      }));
    }
  } catch {
    // Fallback: read directly from content file
  }

  return new Response(JSON.stringify(config, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
