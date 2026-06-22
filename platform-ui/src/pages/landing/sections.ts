import { navigate } from "../../router";
import { el } from "../../ui/helpers";
import { buildMakerSection, makerFooterCredit } from "./maker";
import { BETA_FOOTER, BETA_LABEL } from "./constants";

const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "ollama", label: "Ollama" },
  { id: "custom", label: "Custom API" },
];

export function buildProviderStrip(): HTMLElement {
  const section = el("section", "landing-providers-section landing-reveal");
  section.append(
    el("p", "landing-section-label", "Powered by the AI you already trust"),
  );

  const wrap = el("div", "landing-providers");
  PROVIDERS.forEach((p) => {
    const pill = el("div", "landing-provider-pill");
    const logoBox = el("div", "landing-provider-logo");
    const img = el("img") as HTMLImageElement;
    img.src = `/assets/logos/${p.id}.svg`;
    img.alt = `${p.label} logo`;
    img.width = 32;
    img.height = 32;
    img.loading = "lazy";
    logoBox.appendChild(img);
    pill.append(logoBox, el("span", "landing-provider-name", p.label));
    wrap.appendChild(pill);
  });

  section.appendChild(wrap);
  return section;
}

const FEATURES = [
  {
    icon: "search",
    title: "Use OpenAI, Claude, or your own model",
    desc: "Bring your own API key. No vendor lock-in.",
    highlight: false,
  },
  {
    icon: "hybrid",
    title: "Answers grounded in your documents",
    desc: "Hybrid semantic + keyword search finds the right context before every reply.",
    highlight: true,
  },
  {
    icon: "code",
    title: "Chatbot live in 60 seconds",
    desc: "One embed snippet. Paste it on any site and go live.",
    highlight: false,
  },
  {
    icon: "shield",
    title: "Secure per-organization isolation",
    desc: "Multi-tenant SaaS with encrypted keys and tenant boundaries.",
    highlight: false,
  },
];

function iconSvg(type: string): string {
  const icons: Record<string, string> = {
    search: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>',
    hybrid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    code: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  };
  return icons[type] || icons.search;
}

export function buildHowItWorks(): HTMLElement {
  const section = el("section", "landing-section landing-reveal");
  section.id = "how-it-works";
  section.append(
    el("p", "landing-section-label", "How it works"),
    el("h2", "", "Your chatbot live in 3 steps"),
  );

  const grid = el("div", "landing-bento-3");
  const steps = [
    {
      num: "01",
      img: "/assets/illustrations/step-website.svg",
      title: "Sign up",
      desc: "Create your chatbot workspace in under a minute.",
    },
    {
      num: "02",
      img: "/assets/illustrations/step-upload.svg",
      title: "Train it",
      desc: "Upload PDFs and docs — we index them in the background.",
    },
    {
      num: "03",
      img: null,
      title: "Go live",
      desc: "Paste the embed code on your site. Done.",
      code: `<script src="https://api.example.com/widget/v1/embed.js"
  data-widget-key="wk_..."
  data-api-url="https://api.example.com"
  async></script>`,
    },
  ];

  steps.forEach((s) => {
    const card = el("div", "landing-bento-card landing-step-card");
    card.appendChild(el("span", "landing-step-num", s.num));
    if (s.img) {
      const img = el("img", "illus") as HTMLImageElement;
      img.src = s.img;
      img.alt = "";
      card.appendChild(img);
    }
    card.append(el("h3", "", s.title), el("p", "", s.desc));
    if (s.code) {
      const pre = el("pre", "landing-code-preview");
      pre.textContent = s.code;
      card.appendChild(pre);
    }
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

export function buildFeatures(): HTMLElement {
  const section = el("section", "landing-section landing-reveal");
  section.id = "features";
  section.append(
    el("p", "landing-section-label", "Features"),
    el("h2", "", "Everything you need to launch"),
  );

  const grid = el("div", "landing-bento-2");
  FEATURES.forEach((f) => {
    const card = el("div", `landing-bento-card${f.highlight ? " highlight" : ""}`);
    const iconWrap = el("div", "landing-bento-icon");
    iconWrap.innerHTML = iconSvg(f.icon);
    card.append(iconWrap, el("h3", "", f.title), el("p", "", f.desc));
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

export function buildEmbedBand(): HTMLElement {
  const band = el("section", "landing-section-wide landing-section-gray landing-reveal");
  const split = el("div", "landing-embed-split");

  const left = el("div");
  left.append(el("p", "landing-section-label", "Go live"), el("h2", "", "Your chatbot, one line of code"));
  const steps = el("ol", "landing-embed-steps");
  [
    "Copy the embed snippet from your dashboard.",
    "Paste it in your site HTML, just before </body>.",
    "Publish — the chat bubble appears on matching pages.",
  ].forEach((t) => steps.appendChild(el("li", "", t)));
  left.appendChild(steps);

  const tryBtn = el("a", "btn btn-primary", "Try in dashboard");
  tryBtn.href = "/signup";
  tryBtn.style.marginTop = "20px";
  tryBtn.onclick = (e) => { e.preventDefault(); navigate("/signup"); };
  left.appendChild(tryBtn);

  const browser = el("div", "landing-browser-mock");
  const bar = el("div", "landing-browser-bar");
  bar.append(el("span"), el("span"), el("span"));
  const content = el("div", "landing-browser-content");
  content.append(
    el("p", "", "Your website preview"),
    el("div", "landing-mock-bubble", "💬"),
  );
  browser.append(bar, content);

  split.append(left, browser);
  band.appendChild(split);
  return band;
}

export function buildCtaBand(): HTMLElement {
  const band = el("section", "landing-cta-band landing-reveal");
  band.append(
    el("h2", "", "Ready to add a chatbot to your site?"),
    el("p", "landing-cta-sub", BETA_LABEL),
  );

  const actions = el("div", "landing-cta-actions");
  const signup = el("a", "btn btn-primary btn-lg landing-btn-arrow", "Get started free →");
  signup.href = "/signup";
  signup.onclick = (e) => { e.preventDefault(); navigate("/signup"); };
  const login = el("a", "btn btn-secondary btn-lg", "Sign in");
  login.href = "/login";
  login.onclick = (e) => { e.preventDefault(); navigate("/login"); };
  actions.append(signup, login);
  band.appendChild(actions);
  return band;
}

export function buildFooter(): HTMLElement {
  const footer = el("footer", "landing-footer");
  const logo = el("img") as HTMLImageElement;
  logo.src = "/assets/logo-rag4all.svg";
  logo.alt = "RAG4All";

  const links = el("div", "landing-footer-links");
  const docs = el("a", "", "Docs");
  docs.href = "#";
  const privacy = el("a", "", "Privacy");
  privacy.href = "#";
  links.append(docs, privacy);

  const year = new Date().getFullYear();
  const copy = el("p", "landing-footer-copy", `© ${year} RAG4All — Chatbot for all.`);
  const betaLine = el("p", "landing-footer-beta", BETA_FOOTER);

  footer.append(logo, links, copy, betaLine, makerFooterCredit());
  return footer;
}

export function buildMakerBand(): HTMLElement {
  return buildMakerSection();
}

export function initScrollReveal(root: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els = root.querySelectorAll(".landing-reveal");
  if (reduced) {
    els.forEach((e) => e.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  els.forEach((e) => observer.observe(e));
}
