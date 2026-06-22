let region: HTMLElement | null = null;

function ensureRegion() {
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    document.body.appendChild(region);
  }
  return region;
}

export function showToast(message: string, type: "success" | "error" = "success") {
  const r = ensureRegion();
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  r.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
