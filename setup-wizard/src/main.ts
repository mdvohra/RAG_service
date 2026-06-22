import "./styles/main.css";
import { DEFAULT_CONFIG } from "./config";
import { renderCompleteStep } from "./steps/complete";
import { renderDocumentsStep } from "./steps/documents";
import { renderProviderStep } from "./steps/provider";
import { renderServicesStep } from "./steps/services";
import { renderWebsiteStep } from "./steps/website";
import { setConfig, setStep, getState } from "./state";
import { renderStepper, updateBrandPanel } from "./ui/stepper";
import { el } from "./ui/helpers";

declare global {
  interface Window {
    __RAG_EMBED_CONFIG__?: Partial<typeof DEFAULT_CONFIG>;
  }
}

function init() {
  const config = { ...DEFAULT_CONFIG, ...window.__RAG_EMBED_CONFIG__ };
  setConfig(config);

  const app = document.getElementById("app")!;
  const layout = el("div", "layout");

  const brandPanel = el("div", "brand-panel");
  const brandContent = el("div", "brand-content");
  const brandLogo = el("div", "brand-logo");
  const logoImg = document.createElement("img");
  logoImg.src = "/assets/logo-rag4all.svg";
  logoImg.alt = "RAG4All";
  logoImg.style.height = "32px";
  brandLogo.appendChild(logoImg);
  brandContent.appendChild(brandLogo);
  const brandIllustration = el("div", "brand-illustration");
  const brandTitle = el("h2", "brand-step-title");
  const brandDesc = el("p", "brand-step-desc");
  brandContent.append(brandIllustration, brandTitle, brandDesc);
  brandPanel.appendChild(brandContent);

  const stepPanel = el("div", "step-panel");
  const stepperEl = el("div", "stepper");
  const stepContent = el("div", "step-content");
  stepPanel.append(stepperEl, stepContent);

  layout.append(brandPanel, stepPanel);
  app.appendChild(layout);

  function refresh() {
    renderStepper(stepperEl);
    updateBrandPanel(brandIllustration, brandTitle, brandDesc);
    stepContent.innerHTML = "";
    const go = (n: number) => {
      setStep(n);
      refresh();
    };
    const step = getState().step;
    if (step === 1) renderWebsiteStep(stepContent, () => go(2));
    else if (step === 2) renderServicesStep(stepContent, () => go(3));
    else if (step === 3) renderProviderStep(stepContent, () => go(4));
    else if (step === 4) renderDocumentsStep(stepContent, () => go(5));
    else renderCompleteStep(stepContent);
  }

  refresh();
}

init();
