import { buildEmbedSnippet } from "../api";
import { getConfig, getState } from "../state";
import { el, showToast } from "../ui/helpers";

export function renderCompleteStep(container: HTMLElement) {
  const config = getConfig();
  const state = getState();
  const snippet = buildEmbedSnippet(config, state.siteUrl);

  container.innerHTML = "";
  const h2 = el("h2");
  h2.textContent = "Go live";
  const p = el("p", "step-desc");
  p.textContent = "Copy the embed snippet into your site HTML before </body>.";

  const checklist = el("ul", "checklist");
  const items = [
    { label: "Services connected", done: state.health?.database && state.health?.minio },
    { label: "AI configured", done: state.llmTestOk || state.health?.llm?.ok },
    { label: "Documents uploaded", done: state.documentsUploaded },
  ];
  items.forEach((item) => {
    const li = el("li", item.done ? "done" : "");
    li.textContent = item.label;
    checklist.appendChild(li);
  });

  const pre = el("pre", "code-block");
  pre.textContent = snippet;

  const btnCopy = el("button", "btn");
  btnCopy.textContent = "Copy snippet";
  btnCopy.onclick = async () => {
    await navigator.clipboard.writeText(snippet);
    showToast("Copied to clipboard");
  };

  const keys = el("p", "step-desc");
  keys.innerHTML = `API Key: <code>${config.apiKey}</code><br>Widget Key: <code>${config.widgetKey}</code>`;

  const previewLabel = el("div", "preview-label");
  previewLabel.textContent = "Live widget preview";
  const preview = el("div", "preview-frame");
  preview.id = "widgetPreview";

  const ctas = el("div", "cta-links");
  ctas.innerHTML = `
    <a href="${config.adminUrl}" target="_blank">Document Manager</a>
    <a href="${config.sampleSiteUrl}" target="_blank">Sample site</a>
    <a href="${config.apiUrl}/docs" target="_blank">API docs</a>
  `;

  container.append(h2, p, checklist, pre, btnCopy, keys, previewLabel, preview, ctas);

  loadWidgetPreview(preview, config, state.siteUrl);
}

function loadWidgetPreview(container: HTMLElement, config: import("../config").AppConfig, siteUrl: string) {
  container.innerHTML = "";
  const iframe = el("iframe") as HTMLIFrameElement;
  iframe.style.cssText = "width:100%;height:100%;min-height:420px;border:none;background:#fff";
  const previewHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;background:#f1f5f9;min-height:400px}</style></head><body><p style="padding:16px;color:#64748b;font-size:13px">Your website preview</p><script src="${config.apiUrl}/widget/v1/embed.js" data-widget-key="${config.widgetKey}" data-api-url="${config.apiUrl}" data-site-url="${siteUrl}" data-position="bottom-right" async></script></body></html>`;
  iframe.srcdoc = previewHtml;
  container.appendChild(iframe);
}
