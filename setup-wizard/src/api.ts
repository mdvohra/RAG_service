import type { AppConfig } from "./config";
import { PROVIDER_MODELS } from "./config";

function authHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function fetchReady(apiUrl: string) {
  const r = await fetch(`${apiUrl}/v1/ready`);
  if (!r.ok) throw new Error("API unreachable");
  return r.json();
}

export async function testLlm(
  apiUrl: string,
  provider: string,
  apiKey: string | null,
  baseUrl: string | null
) {
  const r = await fetch(`${apiUrl}/v1/config/llm/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      api_key: apiKey || null,
      model: PROVIDER_MODELS[provider],
      base_url: baseUrl || null,
      message: "Say hello in one short sentence.",
    }),
  });
  return r.json();
}

export async function getDefaultCollection(config: AppConfig): Promise<string> {
  const r = await fetch(`${config.apiUrl}/v1/collections`, {
    headers: authHeaders(config.apiKey),
  });
  const cols = await r.json();
  if (cols.length) return cols[0].id;
  const cr = await fetch(`${config.apiUrl}/v1/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(config.apiKey),
    },
    body: JSON.stringify({ name: "Default", slug: "default" }),
  });
  const col = await cr.json();
  return col.id;
}

export async function uploadDocument(
  config: AppConfig,
  collectionId: string,
  file: File
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("metadata", "{}");
  const r = await fetch(
    `${config.apiUrl}/v1/collections/${collectionId}/documents`,
    {
      method: "POST",
      headers: authHeaders(config.apiKey),
      body: fd,
    }
  );
  if (!r.ok) throw new Error(`Upload failed: ${file.name}`);
  return r.json();
}

export function buildEmbedSnippet(
  config: AppConfig,
  siteUrl: string
): string {
  return `<script
  src="${config.apiUrl}/widget/v1/embed.js"
  data-widget-key="${config.widgetKey}"
  data-api-url="${config.apiUrl}"
  data-site-url="${siteUrl}"
  data-position="bottom-right"
  async></script>`;
}
