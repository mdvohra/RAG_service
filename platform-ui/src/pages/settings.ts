import { api } from "../api";
import { PROVIDER_MODELS } from "../config";
import { renderAppLayout, type Me } from "../layouts/AppLayout";
import { el, normalizeUrl } from "../ui/helpers";
import { showToast } from "../ui/toast";

export async function renderSettings(me: Me) {
  const settings = await api("/dashboard/settings") as Record<string, unknown>;
  const content = el("div");
  content.append(el("h1", "page-title", "Settings"));

  const tabs = el("div", "tabs");
  const panels: Record<string, HTMLElement> = {};
  let active = "website";

  ["website", "ai", "widget"].forEach((tabId) => {
    const tab = el("button", `tab${active === tabId ? " active" : ""}`, tabId === "website" ? "Website" : tabId === "ai" ? "AI" : "Widget");
    tab.onclick = () => {
      active = tabId;
      tabs.querySelectorAll(".tab").forEach((t, i) => {
        t.className = `tab${["website", "ai", "widget"][i] === tabId ? " active" : ""}`;
      });
      panelHost.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
      panels[tabId].classList.remove("hidden");
    };
    tabs.appendChild(tab);
    panels[tabId] = el("div", `tab-panel card${tabId !== active ? " hidden" : ""}`);
  });

  // Website tab
  const siteInput = el("input", "input") as HTMLInputElement;
  siteInput.value = (settings.site_url as string) || "";
  panels.website.append(
    el("h2", "", "Website"),
    el("p", "help-text", "Used to verify widget requests from your domain."),
    (() => {
      const f = el("div", "field");
      f.append(el("label", "", "Site URL"), siteInput);
      return f;
    })(),
    (() => {
      const b = el("button", "btn btn-primary", "Save");
      b.onclick = async () => {
        try {
          await api("/dashboard/settings", {
            method: "PUT",
            body: JSON.stringify({ site_url: normalizeUrl(siteInput.value) }),
          });
          showToast("Saved");
        } catch (e) {
          showToast((e as Error).message, "error");
        }
      };
      return b;
    })()
  );

  // AI tab
  const providerSelect = el("select", "input") as HTMLSelectElement;
  ["openai", "anthropic", "gemini", "ollama", "custom"].forEach((p) => {
    const opt = el("option") as HTMLOptionElement;
    opt.value = p;
    opt.textContent = p;
    if (settings.llm_provider === p) opt.selected = true;
    providerSelect.appendChild(opt);
  });
  const keyInput = el("input", "input") as HTMLInputElement;
  keyInput.type = "password";
  keyInput.placeholder = "Leave blank to keep existing key";
  const modelInput = el("input", "input") as HTMLInputElement;
  modelInput.value = (settings.llm_model as string) || "";
  const baseInput = el("input", "input") as HTMLInputElement;
  baseInput.value = (settings.llm_base_url as string) || "";
  const testResult = el("div");

  panels.ai.append(
    el("h2", "", "AI provider"),
    el("p", "help-text", "Bring your own API key. Keys are encrypted at rest."),
    field("Provider", providerSelect),
    field("API key", keyInput),
    field("Model", modelInput),
    field("Base URL (custom)", baseInput),
    (() => {
      const save = el("button", "btn btn-primary", "Save");
      save.onclick = async () => {
        const body: Record<string, string> = {
          llm_provider: providerSelect.value,
          llm_model: modelInput.value || PROVIDER_MODELS[providerSelect.value],
        };
        if (keyInput.value.trim()) body.llm_api_key = keyInput.value.trim();
        if (baseInput.value.trim()) body.llm_base_url = baseInput.value.trim();
        try {
          await api("/dashboard/settings", { method: "PUT", body: JSON.stringify(body) });
          showToast("Saved");
        } catch (e) {
          showToast((e as Error).message, "error");
        }
      };
      return save;
    })(),
    (() => {
      const test = el("button", "btn btn-secondary", "Test connection");
      test.style.marginLeft = "8px";
      test.onclick = async () => {
        test.disabled = true;
        try {
          const d = await api("/dashboard/settings/llm/test", {
            method: "POST",
            body: JSON.stringify({
              provider: providerSelect.value,
              api_key: keyInput.value.trim() || null,
              model: modelInput.value || PROVIDER_MODELS[providerSelect.value],
              base_url: baseInput.value.trim() || null,
            }),
          }) as { ok: boolean; content?: string; error?: string };
          testResult.innerHTML = d.ok
            ? `<span class="badge ok">OK</span> ${d.content || ""}`
            : `<span class="badge fail">Failed</span> ${d.error || ""}`;
        } catch (e) {
          showToast((e as Error).message, "error");
        }
        test.disabled = false;
      };
      return test;
    })(),
    testResult
  );

  // Widget tab
  const titleInput = el("input", "input") as HTMLInputElement;
  titleInput.value = (settings.widget_title as string) || "";
  const welcomeInput = el("input", "input") as HTMLInputElement;
  welcomeInput.value = (settings.welcome_message as string) || "";
  const colorInput = el("input", "input") as HTMLInputElement;
  colorInput.type = "color";
  colorInput.value = (settings.widget_primary_color as string) || "#5B4FE8";
  const startersInput = el("textarea", "input") as HTMLTextAreaElement;
  startersInput.rows = 4;
  const starters = (settings.starter_questions as string[]) || [];
  startersInput.value = starters.join("\n");

  panels.widget.append(
    el("h2", "", "Widget appearance"),
    field("Title", titleInput),
    el("p", "help-text", "Shown in the chat panel header."),
    field("Welcome message", welcomeInput),
    field("Primary color", colorInput),
    field("Starter questions (one per line)", startersInput),
    (() => {
      const b = el("button", "btn btn-primary", "Save");
      b.onclick = async () => {
        const questions = startersInput.value.split("\n").map((s) => s.trim()).filter(Boolean);
        try {
          await api("/dashboard/settings", {
            method: "PUT",
            body: JSON.stringify({
              widget_title: titleInput.value,
              welcome_message: welcomeInput.value,
              widget_primary_color: colorInput.value,
              starter_questions: questions,
            }),
          });
          showToast("Saved");
        } catch (e) {
          showToast((e as Error).message, "error");
        }
      };
      return b;
    })(),
    el("p", "help-text", `Widget key: ${me.widget_key}`)
  );

  const panelHost = el("div");
  Object.values(panels).forEach((p) => panelHost.appendChild(p));
  content.append(tabs, panelHost);
  return renderAppLayout(me, content, "/app/settings");
}

function field(label: string, input: HTMLElement) {
  const f = el("div", "field");
  f.append(el("label", "", label), input);
  return f;
}
