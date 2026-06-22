import "./styles/main.css";
import { api, getToken, setToken } from "./api";
import { renderAppLayout, type Me } from "./layouts/AppLayout";
import { renderDocuments } from "./pages/documents";
import { renderEmbed } from "./pages/embed";
import { renderHome } from "./pages/home";
import { destroyLanding, renderLanding } from "./pages/landing";
import { renderLogin } from "./pages/login";
import { renderSignup } from "./pages/signup";
import { renderSetup } from "./pages/setup";
import { renderSettings } from "./pages/settings";
import { getPath, initRouter, navigate, register } from "./router";

const app = document.getElementById("app")!;

function mount(node: HTMLElement) {
  destroyLanding();
  app.innerHTML = "";
  app.appendChild(node);
}

async function loadMe(): Promise<Me | null> {
  if (!getToken()) return null;
  try {
    return await api("/auth/me") as Me;
  } catch {
    setToken(null);
    return null;
  }
}

async function renderAppPage(renderFn: (me: Me) => HTMLElement | Promise<HTMLElement>) {
  const me = await loadMe();
  if (!me) {
    navigate("/login", true);
    return;
  }
  const node = await renderFn(me);
  mount(node);
}

register("/", () => mount(renderLanding()));
register("/login", () => mount(renderLogin()));
register("/signup", () => mount(renderSignup()));
register("/app", () => renderAppPage(async (me) => await renderHome(me)));
register("/app/setup", () => renderAppPage(async (me) => await renderSetup(me)));
register("/app/documents", () => renderAppPage(async (me) => await renderDocuments(me)));
register("/app/embed", () => renderAppPage(async (me) => await renderEmbed(me)));
register("/app/settings", () => renderAppPage(async (me) => await renderSettings(me)));

initRouter((path, needsAuth) => {
  if (needsAuth && !getToken()) {
    navigate("/login", true);
    return true;
  }
  if ((path === "/login" || path === "/signup") && getToken()) {
    navigate("/app", true);
    return true;
  }
  return false;
});

// Redirect /app without trailing issues
if (getPath() === "" || getPath() === "/index.html") {
  navigate("/", true);
}
