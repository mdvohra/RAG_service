import { el } from "../ui/helpers";

export function renderAuthLayout(rightContent: HTMLElement, illustration = "/assets/illustrations/step-website.svg", title = "AI chat from your documents", desc = "Sign up, upload knowledge, and embed a chat widget on any website.") {
  const root = el("div", "auth-layout");
  const brand = el("div", "auth-brand");
  const logo = el("img") as HTMLImageElement;
  logo.src = "/assets/logo-rag4all.svg";
  logo.alt = "RAG4All";
  logo.className = "logo";
  const ill = el("img") as HTMLImageElement;
  ill.src = illustration;
  ill.alt = "";
  ill.style.maxWidth = "280px";
  ill.style.margin = "32px 0";
  brand.append(logo, ill, el("h2", "", title), el("p", "", desc));

  const formWrap = el("div", "auth-form");
  formWrap.appendChild(rightContent);
  root.append(brand, formWrap);
  return root;
}
