const cfg = (window as unknown as { __RAG_PLATFORM_CONFIG__?: { apiUrl: string } }).__RAG_PLATFORM_CONFIG__;
export const API_URL = (cfg?.apiUrl || "http://localhost:8000").replace(/\/$/, "");

export function getToken(): string | null {
  return localStorage.getItem("rag_platform_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("rag_platform_token", token);
  else localStorage.removeItem("rag_platform_token");
}

export async function fetchReady() {
  const res = await fetch(`${API_URL}/v1/ready`);
  if (!res.ok) throw new Error("API unreachable");
  return res.json();
}

export async function getDefaultCollectionId(): Promise<string> {
  const cols = await api("/collections") as Array<{ id: string }>;
  if (cols.length) return cols[0].id;
  const col = await api("/collections", {
    method: "POST",
    body: JSON.stringify({ name: "Default", slug: "default" }),
  }) as { id: string };
  return col.id;
}

export function buildEmbedSnippet(widgetKey: string, siteUrl: string): string {
  return `<script
  src="${API_URL}/widget/v1/embed.js"
  data-widget-key="${widgetKey}"
  data-api-url="${API_URL}"
  data-site-url="${siteUrl}"
  data-position="bottom-right"
  async></script>`;
}

export async function api(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}/v1${path}`, { ...options, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = data as { detail?: string | Array<{ msg: string }> };
    const detail = Array.isArray(err?.detail) ? err.detail[0]?.msg : err?.detail;
    throw new Error(detail || res.statusText || "Request failed");
  }
  return data;
}
