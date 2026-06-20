import { testLlm } from "../api";
import { getConfig, getState, patchState } from "../state";
import { el } from "../ui/helpers";

const PROVIDERS = [
  { id: "ollama", label: "Ollama", logo: "/assets/logos/ollama.svg" },
  { id: "openai", label: "OpenAI", logo: "/assets/logos/openai.svg" },
  { id: "anthropic", label: "Claude", logo: "/assets/logos/anthropic.svg" },
  { id: "gemini", label: "Gemini", logo: "/assets/logos/gemini.svg" },
  { id: "custom", label: "Custom", logo: "/assets/logos/custom.svg" },
];

export function renderProviderStep(container: HTMLElement, onNext: () => void) {
  const state = getState();
  const config = getConfig();
  container.innerHTML = "";
  const h2 = el("h2");
  h2.textContent = "AI provider";
  const p = el("p", "step-desc");
  p.textContent =
    "Test your LLM API key here. For full RAG chat, matching values must also be in .env and the API restarted.";

  const grid = el("div", "provider-grid");
  PROVIDERS.forEach((pr) => {
    const card = el("div", `provider-card${state.provider === pr.id ? " selected" : ""}`);
    card.innerHTML = `<img src="${pr.logo}" alt="" width="32" height="32"><span>${pr.label}</span>`;
    card.onclick = () => {
      patchState({ provider: pr.id });
      renderProviderStep(container, onNext);
    };
    grid.appendChild(card);
  });

  const keyField = el("div", "field");
  keyField.innerHTML = `<label>API Key (if required)</label>`;
  const keyInput = el("input") as HTMLInputElement;
  keyInput.type = "password";
  keyInput.placeholder = "sk-...";
  keyInput.value = state.providerApiKey;
  keyField.appendChild(keyInput);

  const baseField = el("div", `field${state.provider === "custom" ? "" : " hidden"}`);
  baseField.innerHTML = `<label>Base URL (OpenAI-compatible)</label>`;
  const baseInput = el("input") as HTMLInputElement;
  baseInput.placeholder = "https://api.groq.com/openai/v1";
  baseInput.value = state.baseUrl;
  baseField.appendChild(baseInput);

  const result = el("div");
  result.style.marginTop = "12px";
  const hint = el("pre", "code-block hidden");
  hint.style.whiteSpace = "pre-wrap";

  const btnTest = el("button", "btn");
  btnTest.textContent = "Test LLM connection";
  btnTest.onclick = async () => {
    patchState({
      providerApiKey: keyInput.value.trim(),
      baseUrl: baseInput.value.trim(),
    });
    if (state.provider === "openai" && !keyInput.value.trim()) {
      result.innerHTML = '<span class="badge fail">Enter your OpenAI API key</span>';
      return;
    }
    btnTest.disabled = true;
    btnTest.innerHTML = '<span class="spinner"></span> Testing...';
    try {
      const d = await testLlm(
        config.apiUrl,
        state.provider,
        keyInput.value.trim() || null,
        baseInput.value.trim() || null
      );
      if (d.ok) {
        patchState({ llmTestOk: true });
        result.innerHTML = `<span class="badge ok">Connected</span> ${d.content || ""}`;
        if (d.env_hint) {
          hint.classList.remove("hidden");
          hint.textContent = `${d.note || ""}\n\n${(d.env_hint as string[]).join("\n")}`;
        }
      } else {
        result.innerHTML = `<span class="badge fail">Failed</span> ${d.error || ""}`;
      }
    } catch (e) {
      result.textContent = "Test failed: " + (e as Error).message;
    }
    btnTest.disabled = false;
    btnTest.textContent = "Test LLM connection";
  };

  const btnNext = el("button", "btn secondary");
  btnNext.textContent = "Continue";
  btnNext.onclick = () => onNext();

  container.append(h2, p, grid, keyField, baseField, btnTest, result, hint, btnNext);
}
