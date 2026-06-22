import { API_URL, api, buildEmbedSnippet } from "../api";
import { renderAppLayout, type Me } from "../layouts/AppLayout";
import { el, normalizeUrl } from "../ui/helpers";
import { showToast } from "../ui/toast";

export async function renderEmbed(me: Me) {
  const settings = await api("/dashboard/settings") as { site_url?: string };
  const siteUrl = normalizeUrl(settings.site_url || me.site_url || "https://localhost");
  const snippet = buildEmbedSnippet(me.widget_key, siteUrl);

  const content = el("div");
  content.append(el("h1", "page-title", "Go live"));

  const steps = el("ol");
  steps.style.lineHeight = "1.8";
  [
    "Copy the embed snippet below.",
    "Paste it in your site HTML, just before </body>.",
    "Publish your site — the chat bubble appears on pages matching your site URL.",
  ].forEach((t) => steps.appendChild(el("li", "", t)));
  content.append(el("h2", "", "How to embed"), steps);

  const pre = el("pre", "code-block");
  pre.textContent = snippet;
  const copyBtn = el("button", "btn btn-primary", "Copy embed code");
  copyBtn.onclick = async () => {
    await navigator.clipboard.writeText(snippet);
    showToast("Copied!");
  };

  const apiNote = el("p", "help-text");
  apiNote.textContent = `Production API URL: ${API_URL} — use this in data-api-url when deploying.`;

  const previewLabel = el("p", "", "Preview");
  previewLabel.style.fontWeight = "600";
  const preview = el("div", "preview-frame");
  const iframe = el("iframe") as HTMLIFrameElement;
  iframe.style.cssText = "width:100%;height:100%;min-height:420px;border:none;background:#fff";
  iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;background:#f1f5f9;min-height:400px}</style></head><body><p style="padding:16px;color:#64748b;font-size:13px">Widget preview</p><script src="${API_URL}/widget/v1/embed.js" data-widget-key="${me.widget_key}" data-api-url="${API_URL}" data-site-url="${siteUrl}" async></script></body></html>`;
  preview.appendChild(iframe);

  content.append(pre, copyBtn, apiNote, previewLabel, preview);
  return renderAppLayout(me, content, "/app/embed");
}
