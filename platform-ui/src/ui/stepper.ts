import { SETUP_STEPS } from "../config";

export function renderStepper(container: HTMLElement, step: number) {
  const progress = ((step - 1) / (SETUP_STEPS.length - 1)) * 100;
  container.innerHTML = `
    <div class="stepper-progress"><div class="stepper-progress-bar" style="width:${progress}%"></div></div>
    <div class="stepper-pills">
      ${SETUP_STEPS.map((s) => {
        const cls = s.id === step ? "active" : s.id < step ? "done" : "";
        return `<span class="stepper-pill ${cls}">${s.name}</span>`;
      }).join("")}
    </div>
  `;
}
