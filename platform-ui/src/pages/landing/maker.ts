import { el } from "../../ui/helpers";

const MAKER = {
  name: "Mohammad Vohra",
  role: "AI Engineer",
  phone: "+91 7284066652",
  tel: "+917284066652",
  email: "mdvohra52@gmail.com",
  collabSubject: "RAG4All collaboration",
};

export function buildMakerSection(): HTMLElement {
  const section = el("section", "landing-maker-section landing-reveal");
  section.id = "maker";

  const inner = el("div", "landing-maker-inner");
  const card = el("div", "landing-maker-card");

  card.append(
    el("span", "landing-section-label", "Meet the maker"),
    el("div", "landing-maker-avatar", "MV"),
    el("h2", "", MAKER.name),
    el("p", "landing-maker-role", MAKER.role),
  );

  const contact = el("div", "landing-maker-contact");
  const phoneLink = el("a") as HTMLAnchorElement;
  phoneLink.href = `tel:${MAKER.tel}`;
  phoneLink.textContent = MAKER.phone;
  phoneLink.setAttribute("aria-label", `Call ${MAKER.name} at ${MAKER.phone}`);
  const emailLink = el("a") as HTMLAnchorElement;
  emailLink.href = `mailto:${MAKER.email}`;
  emailLink.textContent = MAKER.email;
  emailLink.setAttribute("aria-label", `Email ${MAKER.name}`);
  contact.append(phoneLink, emailLink);
  card.appendChild(contact);

  card.appendChild(el("span", "landing-maker-collab-pill", "Collaborations accepted"));

  const collabBtn = el("a", "btn btn-secondary", "Let's collaborate") as HTMLAnchorElement;
  collabBtn.href = `mailto:${MAKER.email}?subject=${encodeURIComponent(MAKER.collabSubject)}`;
  collabBtn.setAttribute("aria-label", "Email Mohammad Vohra about collaborations");
  card.appendChild(collabBtn);

  inner.appendChild(card);
  section.appendChild(inner);
  return section;
}

export function makerFooterCredit(): HTMLElement {
  const p = el("p", "landing-footer-maker");
  const link = el("a") as HTMLAnchorElement;
  link.href = `mailto:${MAKER.email}?subject=${encodeURIComponent(MAKER.collabSubject)}`;
  link.textContent = "Collaborations welcome";
  p.append("Made with care by Mohammad Vohra · ", link);
  return p;
}
