import { navigate } from "../../router";
import { el } from "../../ui/helpers";

const AUDIENCES = [
  { icon: "🚀", title: "SaaS & startups", desc: "Onboard users and answer product questions automatically." },
  { icon: "🛒", title: "E-commerce", desc: "Help shoppers find policies, shipping info, and product details." },
  { icon: "💬", title: "Support teams", desc: "Deflect repetitive tickets with a self-serve chatbot." },
  { icon: "🏢", title: "Agencies", desc: "Deploy chatbots for every client site in minutes." },
];

export function buildAudiencesSection(): HTMLElement {
  const section = el("section", "landing-section landing-reveal");
  section.id = "audiences";
  section.append(
    el("p", "landing-section-label", "Who it's for"),
    el("h2", "", "Chatbot for every team"),
  );

  const grid = el("div", "landing-audiences-grid");
  AUDIENCES.forEach((a) => {
    const card = el("div", "landing-audience-card");
    card.append(
      el("div", "landing-audience-icon", a.icon),
      el("h3", "", a.title),
      el("p", "", a.desc),
      el("span", "landing-audience-link", "Get started →"),
    );
    card.onclick = () => navigate("/signup");
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.onkeydown = (e) => { if (e.key === "Enter") navigate("/signup"); };
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}
