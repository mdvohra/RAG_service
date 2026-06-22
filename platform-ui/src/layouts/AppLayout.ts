import { navigate } from "../router";
import { el } from "../ui/helpers";

export interface Me {
  email: string;
  tenant_name: string;
  site_url: string | null;
  widget_key: string;
  onboarding_complete: boolean;
}

const NAV = [
  { path: "/app", label: "Home" },
  { path: "/app/setup", label: "Setup" },
  { path: "/app/documents", label: "Documents" },
  { path: "/app/embed", label: "Embed" },
  { path: "/app/settings", label: "Settings" },
];

export function renderAppLayout(me: Me, content: HTMLElement, activePath: string) {
  const shell = el("div", "app-shell");
  const sidebar = el("aside", "sidebar");
  const logoRow = el("div", "logo-row");
  const logo = el("img") as HTMLImageElement;
  logo.src = "/assets/logo-rag4all.svg";
  logo.alt = "RAG4All";
  logoRow.append(logo);
  sidebar.append(logoRow, el("div", "org", me.tenant_name));

  NAV.forEach((item) => {
    const btn = el("button", `nav-item${activePath === item.path ? " active" : ""}`, item.label);
    btn.onclick = () => navigate(item.path);
    sidebar.appendChild(btn);
  });

  const main = el("div", "app-main");
  const topbar = el("div", "app-topbar");
  const menuBtn = el("button", "menu-btn", "☰");
  menuBtn.setAttribute("aria-label", "Toggle menu");
  menuBtn.onclick = () => sidebar.classList.toggle("open");
  const userArea = el("div");
  const logout = el("button", "btn btn-ghost btn-sm", "Log out");
  logout.onclick = () => {
    localStorage.removeItem("rag_platform_token");
    window.location.href = "/login";
  };
  userArea.append(el("span", "", me.email), logout);
  topbar.append(menuBtn, userArea);

  const appContent = el("div", "app-content");
  appContent.appendChild(content);
  main.append(topbar, appContent);
  shell.append(sidebar, main);
  return shell;
}
