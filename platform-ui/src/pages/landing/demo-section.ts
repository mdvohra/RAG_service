import { navigate } from "../../router";
import { el } from "../../ui/helpers";
import { BETA_LABEL_SHORT } from "./constants";

const CONVERSATIONS: Record<string, { answer: string; source: string }> = {
  "What are your pricing plans?": {
    answer: "We offer Starter, Pro, and Enterprise tiers. Starter is free during beta until 15 Sept 2026.",
    source: "pricing.pdf",
  },
  "How do I get started?": {
    answer: "Sign up, upload your documents, and paste the embed snippet on your site. Takes about 5 minutes.",
    source: "getting-started.md",
  },
  "Do you offer refunds?": {
    answer: "Yes — we offer a 30-day money-back guarantee on all paid plans.",
    source: "policies.txt",
  },
};

export function buildDemoSection(): HTMLElement {
  const section = el("section", "landing-section landing-demo-section landing-reveal");
  section.id = "demo";

  const split = el("div", "landing-demo-split");
  const left = el("div", "landing-demo-copy");
  left.append(
    el("p", "landing-section-label", "Product"),
    el("h2", "", "See your chatbot in action"),
    el("p", "landing-demo-desc", "Click a starter question below. Answers come from your uploaded documents — just like on your live site."),
  );
  const bullets = el("ul", "landing-demo-bullets");
  ["Grounded in your docs", "Source citations on every answer", "Works on any website"].forEach((t) => {
    bullets.appendChild(el("li", "", t));
  });
  left.appendChild(bullets);

  const panel = el("div", "landing-demo-panel");
  const header = el("div", "landing-widget-header");
  header.innerHTML = "<strong>Your chatbot</strong><span>Demo preview</span>";
  const messages = el("div", "landing-demo-messages");
  messages.appendChild(el("div", "landing-hero-msg landing-hero-msg-bot", "Hi! Ask me anything about your business."));
  const starters = el("div", "landing-widget-starters landing-demo-starters");

  Object.keys(CONVERSATIONS).forEach((q) => {
    const chip = el("button", "starter", q);
    chip.type = "button";
    chip.onclick = () => {
      messages.innerHTML = "";
      messages.appendChild(el("div", "landing-hero-msg landing-hero-msg-bot", "Hi! Ask me anything about your business."));
      messages.appendChild(el("div", "landing-hero-msg landing-hero-msg-user", q));
      const conv = CONVERSATIONS[q];
      const bot = el("div", "landing-hero-msg landing-hero-msg-bot", conv.answer);
      bot.appendChild(el("span", "landing-hero-source-chip", conv.source));
      messages.appendChild(bot);
      messages.scrollTop = messages.scrollHeight;
    };
    starters.appendChild(chip);
  });

  const inputRow = el("div", "landing-widget-input");
  inputRow.append(el("div"), el("button"));
  panel.append(header, messages, starters, inputRow);
  split.append(left, panel);
  section.appendChild(split);

  const cta = el("a", "btn btn-primary btn-lg landing-demo-cta", `Build yours — ${BETA_LABEL_SHORT.toLowerCase()}`);
  cta.href = "/signup";
  cta.onclick = (e) => { e.preventDefault(); navigate("/signup"); };
  section.appendChild(cta);

  return section;
}
