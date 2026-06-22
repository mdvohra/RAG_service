export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    ready: "ok",
    pending: "pending",
    processing: "pending",
    failed: "fail",
  };
  return map[status] || "pending";
}
