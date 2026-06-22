import { API_URL, api, buildEmbedSnippet, fetchReady, getDefaultCollectionId } from "../api";
import { PROVIDER_MODELS, SETUP_STEPS } from "../config";
import { renderAppLayout, type Me } from "../layouts/AppLayout";
import { el, normalizeUrl } from "../ui/helpers";
import { renderStepper } from "../ui/stepper";
import { showToast } from "../ui/toast";

const PROVIDERS = [
  { id: "openai", label: "OpenAI", logo: "/assets/logos/openai.svg" },
  { id: "anthropic", label: "Claude", logo: "/assets/logos/anthropic.svg" },
  { id: "gemini", label: "Gemini", logo: "/assets/logos/gemini.svg" },
  { id: "ollama", label: "Ollama", logo: "/assets/logos/ollama.svg" },
  { id: "custom", label: "Custom", logo: "/assets/logos/custom.svg" },
];

interface SetupState {
  step: number;
  siteUrl: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  llmTestOk: boolean;
  documentsUploaded: boolean;
  collectionId: string | null;
  health: Record<string, unknown> | null;
}

export async function renderSetup(me: Me) {
  const settings = await api("/dashboard/settings") as Record<string, unknown>;
  const state: SetupState = {
    step: 1,
    siteUrl: (settings.site_url as string) || me.site_url || "",
    provider: (settings.llm_provider as string) || "openai",
    apiKey: "",
    baseUrl: (settings.llm_base_url as string) || "",
    llmTestOk: false,
    documentsUploaded: false,
    collectionId: null,
    health: null,
  };

  const content = el("div");
  content.append(el("h1", "page-title", "Guided setup"));
  const stepperHost = el("div");
  const stepHost = el("div", "card");
  content.append(stepperHost, stepHost);

  const shell = renderAppLayout(me, content, "/app/setup");

  function goNext() {
    if (state.step < 5) {
      state.step += 1;
      renderStep();
    }
  }

  async function renderStep() {
    renderStepper(stepperHost, state.step);
    stepHost.innerHTML = "";
    const step = SETUP_STEPS[state.step - 1];
    if (state.step === 1) renderWebsite(stepHost, goNext, state);
    else if (state.step === 2) await renderServices(stepHost, goNext, state);
    else if (state.step === 3) renderProvider(stepHost, goNext, state);
    else if (state.step === 4) renderDocuments(stepHost, goNext, state, me);
    else renderComplete(stepHost, state, me);
  }

  renderStep();
  return shell;
}

function renderWebsite(container: HTMLElement, onNext: () => void, state: SetupState) {
  container.append(el("h2", "", "Your website"), el("p", "help-text", "Where the chat widget will be embedded. We add https:// if missing."));
  const input = el("input", "input") as HTMLInputElement;
  input.placeholder = "www.yourcompany.com";
  input.value = state.siteUrl;
  const field = el("div", "field");
  field.append(el("label", "", "Site URL"), input);
  const btn = el("button", "btn btn-primary", "Continue");
  btn.onclick = async () => {
    const url = normalizeUrl(input.value || state.siteUrl);
    if (!url) {
      showToast("Enter your website URL", "error");
      return;
    }
  try {
      await api("/dashboard/settings", { method: "PUT", body: JSON.stringify({ site_url: url }) });
      state.siteUrl = url;
      onNext();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  };
  container.append(field, btn);
}

async function renderServices(container: HTMLElement, onNext: () => void, state: SetupState) {
  container.append(el("h2", "", "Connect services"), el("p", "help-text", "We verify API, storage, and AI are online."));
  const results = el("div", "health-grid");
  const btnCheck = el("button", "btn btn-secondary", "Run health checks");
  const btnNext = el("button", "btn btn-primary", "Continue");

  async function runCheck() {
    btnCheck.disabled = true;
    btnCheck.innerHTML = '<span class="spinner"></span> Checking...';
    results.innerHTML = "";
    try {
      const d = await fetchReady() as { checks?: Record<string, unknown> };
      const checks = d.checks || {};
      state.health = checks as Record<string, unknown>;
      const tiles = [
        { name: "API / Database", ok: checks.database },
        { name: "MinIO Storage", ok: checks.minio },
        { name: "LLM Provider", ok: (checks.llm as { ok?: boolean })?.ok },
      ];
      tiles.forEach((t) => {
        const tile = el("div", "health-tile");
        tile.innerHTML = `<strong>${t.name}</strong><span class="badge ${t.ok ? "ok" : "fail"}">${t.ok ? "OK" : "Issue"}</span>`;
        results.appendChild(tile);
      });
    } catch {
      results.innerHTML = '<span class="badge fail">API unreachable</span>';
    }
    btnCheck.disabled = false;
    btnCheck.textContent = "Run health checks";
  }

  btnCheck.onclick = () => runCheck();
  btnNext.onclick = () => onNext();
  container.append(btnCheck, results, btnNext);
  await runCheck();
}

function renderProvider(container: HTMLElement, onNext: () => void, state: SetupState) {
  container.append(
    el("h2", "", "AI provider"),
    el("p", "help-text", "Bring your own API key. Your key is encrypted and never shown again.")
  );

  const grid = el("div", "provider-grid");
  PROVIDERS.forEach((pr) => {
    const card = el("div", `provider-card${state.provider === pr.id ? " selected" : ""}`);
    card.innerHTML = `<img src="${pr.logo}" alt="" width="32" height="32"><span>${pr.label}</span>`;
    card.onclick = () => {
      state.provider = pr.id;
      renderProvider(container, onNext, state);
    };
    grid.appendChild(card);
  });

  const keyField = el("div", "field");
  keyField.append(el("label", "", "API key"));
  const keyInput = el("input", "input") as HTMLInputElement;
  keyInput.type = "password";
  keyInput.placeholder = "sk-...";
  keyField.appendChild(keyInput);

  const baseField = el("div", `field${state.provider === "custom" ? "" : " hidden"}`);
  baseField.append(el("label", "", "Base URL (OpenAI-compatible)"));
  const baseInput = el("input", "input") as HTMLInputElement;
  baseInput.placeholder = "https://api.groq.com/openai/v1";
  baseInput.value = state.baseUrl;
  baseField.appendChild(baseInput);

  const result = el("div");
  const btnTest = el("button", "btn btn-secondary", "Test connection");
  btnTest.onclick = async () => {
    btnTest.disabled = true;
    btnTest.innerHTML = '<span class="spinner"></span> Testing...';
    try {
      const d = await api("/dashboard/settings/llm/test", {
        method: "POST",
        body: JSON.stringify({
          provider: state.provider,
          api_key: keyInput.value.trim() || null,
          model: PROVIDER_MODELS[state.provider],
          base_url: baseInput.value.trim() || null,
        }),
      }) as { ok: boolean; content?: string; error?: string };
      if (d.ok) {
        state.llmTestOk = true;
        if (keyInput.value.trim()) {
          await api("/dashboard/settings", {
            method: "PUT",
            body: JSON.stringify({
              llm_provider: state.provider,
              llm_api_key: keyInput.value.trim(),
              llm_model: PROVIDER_MODELS[state.provider],
              llm_base_url: baseInput.value.trim() || null,
            }),
          });
        }
        result.innerHTML = `<span class="badge ok">Connected</span> ${d.content || ""}`;
      } else {
        result.innerHTML = `<span class="badge fail">Failed</span> ${d.error || ""}`;
      }
    } catch (e) {
      showToast((e as Error).message, "error");
    }
    btnTest.disabled = false;
    btnTest.textContent = "Test connection";
  };

  const btnNext = el("button", "btn btn-primary", "Continue");
  btnNext.onclick = () => onNext();
  container.append(grid, keyField, baseField, btnTest, result, btnNext);
}

function renderDocuments(container: HTMLElement, onNext: () => void, state: SetupState, me: Me) {
  container.append(el("h2", "", "Upload documents"), el("p", "help-text", "Add PDF, TXT, or Markdown files. Processing runs in the background."));

  const zone = el("div", "drop-zone");
  const fileInput = el("input") as HTMLInputElement;
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.accept = ".pdf,.txt,.md,.markdown";
  zone.append(el("p", "", "Choose files or drag here"), fileInput);

  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.style.borderColor = "var(--rag-primary)"; });
  zone.addEventListener("dragleave", () => { zone.style.borderColor = ""; });
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.style.borderColor = "";
    if (e.dataTransfer?.files.length) fileInput.files = e.dataTransfer.files;
  });

  const status = el("div");
  const link = el("p", "help-text");
  link.innerHTML = `Or manage files on the <a href="/app/documents">Documents</a> page.`;

  const btnUpload = el("button", "btn btn-primary", "Upload selected");
  btnUpload.onclick = async () => {
    const files = fileInput.files;
    if (!files?.length) {
      showToast("Select files first", "error");
      return;
    }
    btnUpload.disabled = true;
    try {
      if (!state.collectionId) state.collectionId = await getDefaultCollectionId();
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("metadata", "{}");
        await api(`/collections/${state.collectionId}/documents`, { method: "POST", body: fd });
      }
      state.documentsUploaded = true;
      status.textContent = `Uploaded ${files.length} file(s). Processing in background.`;
      showToast("Upload complete");
      fileInput.value = "";
    } catch (e) {
      showToast((e as Error).message, "error");
    }
    btnUpload.disabled = false;
  };

  const btnNext = el("button", "btn btn-secondary", "Continue");
  btnNext.onclick = () => onNext();
  container.append(zone, btnUpload, status, link, btnNext);
}

function renderComplete(container: HTMLElement, state: SetupState, me: Me) {
  const siteUrl = state.siteUrl || me.site_url || "https://localhost";
  const snippet = buildEmbedSnippet(me.widget_key, siteUrl);

  container.append(el("h2", "", "Go live"), el("p", "help-text", "Copy the embed snippet into your site HTML before </body>."));

  const checklist = el("ul", "checklist");
  [
    { label: "Services connected", done: state.health?.database && state.health?.minio },
    { label: "AI configured", done: state.llmTestOk || (state.health?.llm as { ok?: boolean })?.ok },
    { label: "Documents uploaded", done: state.documentsUploaded },
  ].forEach((item) => {
    const li = el("li", item.done ? "done" : "", item.label);
    checklist.appendChild(li);
  });

  const pre = el("pre", "code-block");
  pre.textContent = snippet;

  const btnCopy = el("button", "btn btn-primary", "Copy snippet");
  btnCopy.onclick = async () => {
    await navigator.clipboard.writeText(snippet);
    showToast("Copied to clipboard");
  };

  const finishBtn = el("button", "btn btn-secondary", "Mark setup complete");
  finishBtn.onclick = async () => {
    try {
      await api("/dashboard/settings", { method: "PUT", body: JSON.stringify({ onboarding_complete: true }) });
      showToast("Setup complete!");
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  };

  const previewLabel = el("p", "", "Live widget preview");
  previewLabel.style.fontWeight = "600";
  const preview = el("div", "preview-frame");
  const iframe = el("iframe") as HTMLIFrameElement;
  iframe.style.cssText = "width:100%;height:100%;min-height:420px;border:none;background:#fff";
  const previewHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;background:#f1f5f9;min-height:400px}</style></head><body><p style="padding:16px;color:#64748b;font-size:13px">Your website preview</p><script src="${API_URL}/widget/v1/embed.js" data-widget-key="${me.widget_key}" data-api-url="${API_URL}" data-site-url="${siteUrl}" data-position="bottom-right" async></script></body></html>`;
  iframe.srcdoc = previewHtml;
  preview.appendChild(iframe);

  const apiNote = el("p", "help-text");
  apiNote.textContent = `API URL for production embed: ${API_URL}`;

  container.append(checklist, pre, btnCopy, finishBtn, previewLabel, preview, apiNote);
}
