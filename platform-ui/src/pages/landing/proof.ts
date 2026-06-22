import { el } from "../../ui/helpers";
import { BETA_LABEL_SHORT } from "./constants";

export function buildProofSection(): HTMLElement {
  const section = el("section", "landing-proof landing-reveal");
  section.append(el("p", "landing-section-label", "Why RAG4All"));

  const stats = el("div", "landing-proof-stats");
  [
    { value: "5 min", label: "Average setup time" },
    { value: "Free", label: BETA_LABEL_SHORT },
    { value: "Any site", label: "One embed snippet" },
  ].forEach((s) => {
    const tile = el("div", "landing-proof-stat");
    tile.append(el("div", "landing-proof-value", s.value), el("div", "landing-proof-label", s.label));
    stats.appendChild(tile);
  });

  const quote = el("blockquote", "landing-proof-quote");
  quote.append(
    el("p", "", "Built for teams who want a smart chatbot on their website — without hiring developers or building from scratch."),
    el("cite", "", "— RAG4All beta"),
  );

  const collab = el("a", "landing-maker-collab-pill", "Collaborations welcome →");
  collab.href = "#maker";
  collab.onclick = (e) => {
    e.preventDefault();
    document.getElementById("maker")?.scrollIntoView({ behavior: "smooth" });
  };

  section.append(stats, quote, collab);
  return section;
}
