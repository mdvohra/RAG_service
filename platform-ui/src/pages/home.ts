import { api } from "../api";
import { renderAppLayout, type Me } from "../layouts/AppLayout";
import { navigate } from "../router";
import { el } from "../ui/helpers";

interface Overview {
  documents_total: number;
  documents_ready: number;
  onboarding_complete: boolean;
  widget_key: string;
  site_url: string | null;
  health: { api: boolean; llm: boolean };
}

export async function renderHome(me: Me) {
  const content = el("div");
  content.append(el("h1", "page-title", "Dashboard"));

  let overview: Overview | null = null;
  try {
    overview = await api("/dashboard/overview") as Overview;
  } catch {
    content.append(el("p", "", "Could not load dashboard. Try refreshing."));
    return renderAppLayout(me, content, "/app");
  }

  if (!overview.onboarding_complete) {
    const banner = el("div", "banner");
    banner.append(
      el("span", "", "Finish setup to go live with your widget."),
      (() => {
        const b = el("button", "btn btn-primary btn-sm", "Continue setup");
        b.onclick = () => navigate("/app/setup");
        return b;
      })()
    );
    content.appendChild(banner);
  }

  const grid = el("div", "stats-grid");
  const setupStatus = overview.onboarding_complete ? "Complete" : "In progress";
  const widgetStatus = overview.documents_ready > 0 ? "Ready to embed" : "Add documents first";

  [
    { label: "Setup", value: setupStatus },
    { label: "Documents indexed", value: String(overview.documents_ready) },
    { label: "Total documents", value: String(overview.documents_total) },
    { label: "Widget", value: widgetStatus },
  ].forEach((s) => {
    const c = el("div", "card stat-card");
    c.append(el("div", "label", s.label), el("div", "value", s.value));
    grid.appendChild(c);
  });
  content.appendChild(grid);

  const actions = el("div");
  actions.style.display = "flex";
  actions.style.gap = "12px";
  actions.style.flexWrap = "wrap";

  const uploadBtn = el("button", "btn btn-primary", "Upload file");
  uploadBtn.onclick = () => navigate("/app/documents");
  const setupBtn = el("button", "btn btn-secondary", "Open setup");
  setupBtn.onclick = () => navigate("/app/setup");
  const embedBtn = el("button", "btn btn-secondary", "Copy embed");
  embedBtn.onclick = () => navigate("/app/embed");
  actions.append(uploadBtn, setupBtn, embedBtn);
  content.append(el("h2", "", "Quick actions"), actions);

  const health = el("p", "help-text");
  health.textContent = `API: ${overview.health.api ? "OK" : "Issue"} · LLM: ${overview.health.llm ? "OK" : "Configure in Settings"}`;
  content.appendChild(health);

  return renderAppLayout(me, content, "/app");
}
