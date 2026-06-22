import { el } from "../../ui/helpers";

const ROWS = [
  { before: "Visitors bounce with unanswered questions", after: "Instant answers from your content" },
  { before: "Support inbox overload", after: "24/7 self-serve chat" },
  { before: "Building custom AI is expensive", after: "One embed snippet, your BYOK key" },
];

export function buildProblemSection(): HTMLElement {
  const section = el("section", "landing-problem landing-reveal");
  section.append(
    el("p", "landing-section-label", "The problem"),
    el("h2", "", "Your visitors have questions. Who answers them?"),
  );

  const grid = el("div", "landing-problem-grid");
  ROWS.forEach((r) => {
    const card = el("div", "landing-problem-card");
    card.append(
      el("div", "landing-problem-before", r.before),
      el("div", "landing-problem-arrow", "→"),
      el("div", "landing-problem-after", r.after),
    );
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}
