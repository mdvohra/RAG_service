import { navigate } from "../../router";
import { el } from "../../ui/helpers";
import { BETA_LABEL_SHORT } from "./constants";
import { buildProductMock } from "./product-mock";

export function buildHero(): { wrap: HTMLElement; stage: HTMLElement; demoRoot: HTMLElement } {
  const wrap = el("div", "landing-hero-wrap");
  const inner = el("div", "landing-hero-inner");

  const copy = el("div", "landing-hero-copy");
  const eyebrowRow = el("div", "landing-eyebrow-row");
  eyebrowRow.append(
    el("span", "landing-eyebrow", "Chatbot for all"),
    el("span", "landing-beta-badge", BETA_LABEL_SHORT),
  );
  copy.appendChild(eyebrowRow);

  const h1 = el("h1");
  h1.innerHTML = 'Add an AI <span class="landing-gradient-text">chatbot</span> to any website in minutes';
  copy.append(
    h1,
    el("p", "landing-hero-sub", "Upload your docs, connect your AI, and paste one line of code. Give every visitor instant answers — 24/7 support without a dev team."),
  );

  const actions = el("div", "landing-hero-actions");
  const startBtn = el("a", "btn btn-primary btn-lg landing-btn-arrow", "Get your chatbot free →");
  startBtn.href = "/signup";
  startBtn.onclick = (e) => { e.preventDefault(); navigate("/signup"); };
  const howBtn = el("a", "btn btn-secondary btn-lg", "Watch it work");
  howBtn.href = "#demo";
  howBtn.onclick = (e) => {
    e.preventDefault();
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };
  actions.append(startBtn, howBtn);
  copy.appendChild(actions);

  const trust = el("div", "landing-trust-row");
  [`No credit card · ${BETA_LABEL_SHORT}`, "5-min setup", "Works on any site"].forEach((t) => {
    trust.appendChild(el("span", "", t));
  });
  copy.appendChild(trust);

  const stageWrap = buildProductMock();
  const stage = stageWrap.querySelector(".landing-hero-stage") as HTMLElement;

  inner.append(copy, stageWrap);
  wrap.appendChild(inner);
  return { wrap, stage, demoRoot: stageWrap };
}
