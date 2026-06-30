/**
 * Shared form submission utility
 * Handles JSON and FormData (with files) submissions
 */

interface SubmitResult {
  success: boolean;
  correlativo?: string;
  error?: string;
}

interface SubmitOptions {
  formType: string;
  data: Record<string, string | boolean>;
  files?: Record<string, File[]>;
  honeypot?: string;
}

export async function submitForm({ formType, data, files, honeypot }: SubmitOptions): Promise<SubmitResult> {
  const base = (import.meta as any).env?.BASE_URL || "/";
  const endpoint = `${base}send-email.php`.replace(/\/\//g, "/");

  const hasFiles = files && Object.values(files).some(arr => arr.length > 0);

  let res: Response;

  if (hasFiles) {
    // Use FormData for file uploads
    const formData = new FormData();
    formData.append('formType', formType);
    if (honeypot) formData.append('website', honeypot);

    // Add all text fields
    for (const [key, val] of Object.entries(data)) {
      formData.append(key, String(val));
    }

    // Add files
    for (const [fieldName, fileList] of Object.entries(files!)) {
      for (const file of fileList) {
        formData.append(`${fieldName}[]`, file);
      }
    }

    res = await fetch(endpoint, { method: 'POST', body: formData });
  } else {
    // Use JSON for forms without files
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formType, ...data, website: honeypot || '' }),
    });
  }

  const result = await res.json();
  return result;
}