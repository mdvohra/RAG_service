import { getConfig, getState, patchState } from "../state";
import { el } from "../ui/helpers";

export function renderWebsiteStep(container: HTMLElement, onNext: () => void) {
  const state = getState();
  container.innerHTML = "";
  const h2 = el("h2");
  h2.textContent = "Your website";
  const p = el("p", "step-desc");
  p.textContent =
    "Enter the URL where the chat widget will be embedded. For local testing, any localhost URL works.";
  const field = el("div", "field");
  const label = el("label");
  label.textContent = "SITE_URL";
  const input = el("input") as HTMLInputElement;
  input.id = "siteUrl";
  input.placeholder = "https://www.yourcompany.com";
  input.value = state.siteUrl;
  field.append(label, input);
  const btn = el("button", "btn");
  btn.textContent = "Continue";
  btn.onclick = () => {
    patchState({ siteUrl: input.value.trim() || state.siteUrl });
    onNext();
  };
  container.append(h2, p, field, btn);
}
