import { STEPS } from "../config";
import { getState } from "../state";

export function renderStepper(container: HTMLElement) {
  const state = getState();
  const progress = ((state.step - 1) / (STEPS.length - 1)) * 100;

  container.innerHTML = `
    <div class="stepper-progress"><div class="stepper-progress-bar" style="width:${progress}%"></div></div>
    <div class="stepper-steps">
      ${STEPS.map((s) => {
        const cls =
          s.id === state.step
            ? "active"
            : s.id < state.step
              ? "done"
              : "";
        return `<span class="stepper-pill ${cls}">${s.name}</span>`;
      }).join("")}
    </div>
  `;
}

export function updateBrandPanel(brandIllustration: HTMLElement, titleEl: HTMLElement, descEl: HTMLElement) {
  const state = getState();
  const step = STEPS[state.step - 1];
  brandIllustration.innerHTML = `<img src="${step.illustration}" alt="" />`;
  titleEl.textContent = step.title;
  descEl.textContent = step.desc;
}
