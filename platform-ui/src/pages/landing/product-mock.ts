import { el } from "../../ui/helpers";

function miniBrowser(label: string, cls: string): HTMLElement {
  const mini = el("div", `landing-mini-browser ${cls}`);
  const bar = el("div", "landing-mini-browser-bar");
  bar.append(el("span"), el("span"), el("span"));
  const body = el("div", "landing-mini-browser-body");
  body.appendChild(el("p", "", label));
  mini.append(bar, body);
  return mini;
}

export function buildProductMock(): HTMLElement {
  const wrap = el("div", "landing-hero-stage-wrap");
  const stage = el("div", "landing-hero-stage");
  stage.setAttribute("aria-hidden", "true");

  wrap.appendChild(miniBrowser("E-commerce store", "mini-1"));
  wrap.appendChild(miniBrowser("Docs site", "mini-2"));

  const browser = el("div", "landing-hero-browser");
  const bar = el("div", "landing-browser-bar");
  bar.append(el("span"), el("span"), el("span"));
  const url = el("div", "landing-browser-url", "www.yourcompany.com");
  bar.appendChild(url);

  const site = el("div", "landing-hero-site");
  site.append(
    el("div", "landing-hero-site-hero", "Welcome to your site"),
    el("p", "", "Your visitors browse here — your chatbot answers their questions instantly."),
  );

  const bubble = el("button", "landing-hero-chat-bubble", "💬");
  bubble.setAttribute("aria-hidden", "true");
  bubble.type = "button";

  const panel = el("div", "landing-hero-chat-panel");
  const header = el("div", "landing-widget-header");
  header.innerHTML = "<strong>Ask us anything</strong><span>Powered by your documents</span>";
  const messages = el("div", "landing-hero-chat-messages");
  const inputRow = el("div", "landing-widget-input");
  inputRow.append(el("div"), el("button"));
  panel.append(header, messages, inputRow);

  browser.append(bar, site, bubble, panel);
  stage.appendChild(browser);
  wrap.appendChild(stage);
  return wrap;
}
