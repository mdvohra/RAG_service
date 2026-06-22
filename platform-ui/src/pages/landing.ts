import "../styles/landing.css";
import { navigate } from "../router";
import { el } from "../ui/helpers";
import { buildAudiencesSection } from "./landing/audiences";
import { BETA_LABEL_SHORT } from "./landing/constants";
import { buildDemoSection } from "./landing/demo-section";
import { buildFaqSection } from "./landing/faq";
import { buildHero } from "./landing/hero";
import { destroyHeroChatDemo, initHeroChatDemo } from "./landing/hero-demo";
import { mountHeroScene, unmountHeroScene } from "./landing/hero-scene";
import { buildProblemSection } from "./landing/problem";
import { buildProofSection } from "./landing/proof";
import {
  buildCtaBand,
  buildEmbedBand,
  buildFeatures,
  buildFooter,
  buildHowItWorks,
  buildMakerBand,
  buildProviderStrip,
  initScrollReveal,
} from "./landing/sections";

let activeHeroWrap: HTMLElement | null = null;
let activeDemoRoot: HTMLElement | null = null;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function buildNav(): { nav: HTMLElement; mobile: HTMLElement } {
  const navEl = el("nav", "landing-nav");
  const brand = el("a", "landing-nav-brand");
  brand.href = "/";
  brand.onclick = (e) => { e.preventDefault(); navigate("/"); };
  const logo = el("img") as HTMLImageElement;
  logo.src = "/assets/logo-rag4all.svg";
  logo.alt = "RAG4All";
  brand.appendChild(logo);

  const links = el("div", "landing-nav-links");
  const product = el("a", "nav-link", "Product") as HTMLAnchorElement;
  product.href = "#demo";
  product.onclick = (e) => { e.preventDefault(); scrollTo("demo"); };
  const how = el("a", "nav-link", "How it works") as HTMLAnchorElement;
  how.href = "#how-it-works";
  how.onclick = (e) => { e.preventDefault(); scrollTo("how-it-works"); };
  const betaBadge = el("span", "landing-nav-beta", `Free beta · ${BETA_LABEL_SHORT.replace("Free until ", "until ")}`);
  links.append(product, how, betaBadge);

  const actions = el("div", "landing-nav-actions");
  const signIn = el("a", "btn btn-ghost btn-sm", "Sign in");
  signIn.href = "/login";
  signIn.onclick = (e) => { e.preventDefault(); navigate("/login"); };
  const signUp = el("a", "btn btn-primary btn-sm", "Get your chatbot");
  signUp.href = "/signup";
  signUp.onclick = (e) => { e.preventDefault(); navigate("/signup"); };
  actions.append(signIn, signUp);

  const menuBtn = el("button", "landing-menu-btn", "☰");
  menuBtn.setAttribute("aria-label", "Toggle menu");

  const mobile = el("div", "landing-nav-mobile");
  [
    { label: "Product", id: "demo" },
    { label: "How it works", id: "how-it-works" },
    { label: "Sign in", route: "/login" },
    { label: "Get your chatbot", route: "/signup" },
  ].forEach((item) => {
    const a = el("a", "nav-link", item.label) as HTMLAnchorElement;
    if (item.id) {
      a.href = `#${item.id}`;
      a.onclick = (e) => { e.preventDefault(); mobile.classList.remove("open"); scrollTo(item.id!); };
    } else {
      a.href = item.route!;
      a.onclick = (e) => { e.preventDefault(); navigate(item.route!); };
    }
    mobile.appendChild(a);
  });

  menuBtn.onclick = () => mobile.classList.toggle("open");
  navEl.append(brand, links, actions, menuBtn);
  return { nav: navEl, mobile };
}

export function destroyLanding() {
  destroyHeroChatDemo();
  if (activeHeroWrap) {
    unmountHeroScene(activeHeroWrap);
    activeHeroWrap = null;
  }
  activeDemoRoot = null;
}

export function renderLanding(): HTMLElement {
  destroyLanding();

  const page = el("div", "landing-page");
  const { nav, mobile } = buildNav();
  page.append(nav, mobile);

  const { wrap: heroWrap, stage, demoRoot } = buildHero();
  activeHeroWrap = heroWrap;
  activeDemoRoot = demoRoot;
  page.appendChild(heroWrap);

  requestAnimationFrame(() => {
    mountHeroScene(heroWrap, stage);
    initHeroChatDemo(demoRoot);
  });

  page.append(
    buildProviderStrip(),
    buildProblemSection(),
    buildHowItWorks(),
    buildDemoSection(),
    buildAudiencesSection(),
    buildFeatures(),
    buildProofSection(),
    buildEmbedBand(),
    buildMakerBand(),
    buildFaqSection(),
    buildCtaBand(),
    buildFooter(),
  );

  initScrollReveal(page);
  return page;
}
