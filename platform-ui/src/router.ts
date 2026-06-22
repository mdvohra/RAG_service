type Handler = () => void | Promise<void>;

const routes: Array<{ path: string; handler: Handler; auth?: boolean }> = [];
let currentPath = "";

export function register(path: string, handler: Handler, auth = false) {
  routes.push({ path, handler, auth });
}

export function navigate(path: string, replace = false) {
  if (replace) history.replaceState(null, "", path);
  else history.pushState(null, "", path);
  resolve();
}

export function getPath(): string {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

export async function resolve() {
  currentPath = getPath();
  const match = routes.find((r) => r.path === currentPath);
  if (!match) {
    const fallback = routes.find((r) => r.path === "/");
    if (fallback) {
      navigate("/", true);
      return;
    }
    return;
  }
  await match.handler();
}

export function initRouter(onRoute: (path: string, needsAuth: boolean) => boolean) {
  window.addEventListener("popstate", () => resolve());
  currentPath = getPath();
  const match = routes.find((r) => r.path === currentPath);
  if (match && onRoute(currentPath, match.auth || false)) return;
  resolve();
}
