import { fetchReady } from "../api";
import { getConfig, getState, patchState } from "../state";
import { el } from "../ui/helpers";

export async function renderServicesStep(container: HTMLElement, onNext: () => void) {
  const config = getConfig();
  container.innerHTML = "";
  const h2 = el("h2");
  h2.textContent = "Connect services";
  const p = el("p", "step-desc");
  p.textContent = "We verify your API, object storage, and LLM are online.";
  const results = el("div", "health-grid");
  const accordion = el("div", "accordion hidden");
  const btnCheck = el("button", "btn");
  btnCheck.textContent = "Run health checks";
  const btnNext = el("button", "btn secondary");
  btnNext.textContent = "Continue";
  btnNext.onclick = () => onNext();

  async function runCheck() {
    btnCheck.disabled = true;
    btnCheck.innerHTML = '<span class="spinner"></span> Checking...';
    results.innerHTML = "";
    try {
      const d = await fetchReady(config.apiUrl);
      const checks = d.checks || {};
      patchState({
        health: {
          database: checks.database,
          minio: checks.minio,
          llm: checks.llm,
          embedding_provider: checks.embedding_provider,
          raw: d,
        },
      });
      const tiles = [
        { name: "API / Database", ok: checks.database },
        { name: "MinIO Storage", ok: checks.minio },
        { name: "LLM Provider", ok: checks.llm?.ok },
      ];
      tiles.forEach((t) => {
        const tile = el("div", "health-tile");
        tile.innerHTML = `<strong>${t.name}</strong><span class="badge ${t.ok ? "ok" : "fail"}">${t.ok ? "OK" : "Issue"}</span>`;
        results.appendChild(tile);
      });
      accordion.classList.remove("hidden");
      accordion.innerHTML = `<details><summary>Technical details</summary><pre>${JSON.stringify(d, null, 2)}</pre></details>`;
    } catch {
      results.innerHTML = '<span class="badge fail">API unreachable</span>';
    }
    btnCheck.disabled = false;
    btnCheck.textContent = "Run health checks";
  }

  btnCheck.onclick = () => runCheck();
  const btnRow = el("div", "btn-row");
  btnRow.appendChild(btnNext);
  container.append(h2, p, btnCheck, results, accordion, btnRow);

  await runCheck();
}
