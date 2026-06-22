import { el } from "../../ui/helpers";
import { BETA_FAQ_ANSWER } from "./constants";

const FAQS = [
  {
    q: "Do I need developers to install it?",
    a: "No. Copy one script tag and paste it before </body> on your site. No backend changes required.",
  },
  {
    q: "Which AI models are supported?",
    a: "OpenAI, Claude, Gemini, Ollama, and any OpenAI-compatible API. Bring your own key.",
  },
  {
    q: "Is my data secure?",
    a: "Each organization is isolated. API keys are encrypted at rest. Your documents stay in your tenant.",
  },
  {
    q: "Can I use it on localhost while testing?",
    a: "Yes. Set your site URL to localhost during setup and test the widget on your local dev server.",
  },
  {
    q: "Is it really free during beta?",
    a: BETA_FAQ_ANSWER,
  },
];

export function buildFaqSection(): HTMLElement {
  const section = el("section", "landing-section landing-faq landing-reveal");
  section.id = "faq";
  section.append(
    el("p", "landing-section-label", "FAQ"),
    el("h2", "", "Common questions"),
  );

  const list = el("div", "landing-faq-list");
  FAQS.forEach((item) => {
    const details = el("details", "landing-faq-item");
    const summary = el("summary", "", item.q);
    const body = el("p", "landing-faq-a", item.a);
    details.append(summary, body);
    list.appendChild(details);
  });

  section.appendChild(list);
  return section;
}
