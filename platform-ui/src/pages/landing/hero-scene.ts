let rafId = 0;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let blobs: Array<{ x: number; y: number; vx: number; vy: number; r: number; color: string }> = [];
let resizeObserver: ResizeObserver | null = null;
let parallaxTarget: HTMLElement | null = null;
let reducedMotion = false;

const BLOB_COLORS = [
  "rgba(196, 181, 253, 0.35)",
  "rgba(191, 219, 254, 0.35)",
  "rgba(251, 207, 232, 0.3)",
  "rgba(237, 233, 254, 0.5)",
];

function initBlobs(w: number, h: number) {
  blobs = BLOB_COLORS.map((color, i) => ({
    x: w * (0.2 + i * 0.18),
    y: h * (0.3 + (i % 2) * 0.2),
    vx: (i % 2 === 0 ? 1 : -1) * 0.15,
    vy: (i % 2 === 0 ? -1 : 1) * 0.12,
    r: Math.min(w, h) * (0.22 + i * 0.04),
    color,
  }));
}

function draw() {
  if (!canvas || !ctx || reducedMotion) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  blobs.forEach((b) => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -b.r) b.x = w + b.r;
    if (b.x > w + b.r) b.x = -b.r;
    if (b.y < -b.r) b.y = h + b.r;
    if (b.y > h + b.r) b.y = -b.r;

    const g = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx!.fillStyle = g;
    ctx!.beginPath();
    ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx!.fill();
  });

  if (!document.hidden) {
    rafId = requestAnimationFrame(draw);
  }
}

function resize() {
  if (!canvas || !canvas.parentElement) return;
  const parent = canvas.parentElement;
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  canvas.width = w;
  canvas.height = h;
  if (blobs.length === 0) initBlobs(w, h);
}

export function mountHeroScene(heroWrap: HTMLElement, stageEl: HTMLElement) {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  parallaxTarget = stageEl;

  canvas = document.createElement("canvas");
  canvas.className = "landing-hero-canvas";
  heroWrap.insertBefore(canvas, heroWrap.firstChild);

  ctx = canvas.getContext("2d");
  resize();

  resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(heroWrap);

  if (!reducedMotion) {
    rafId = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", onVisibility);
    heroWrap.addEventListener("mousemove", onMouseMove);
  }
}

function onVisibility() {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
  } else if (!reducedMotion) {
    rafId = requestAnimationFrame(draw);
  }
}

function onMouseMove(e: MouseEvent) {
  if (!parallaxTarget || reducedMotion) return;
  const rect = parallaxTarget.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = (e.clientX - cx) / rect.width;
  const dy = (e.clientY - cy) / rect.height;
  const px = Math.max(-8, Math.min(8, dx * 16));
  const py = Math.max(-8, Math.min(8, dy * 16));
  parallaxTarget.style.setProperty("--px", `${px}px`);
  parallaxTarget.style.setProperty("--py", `${py}px`);
}

export function unmountHeroScene(heroWrap?: HTMLElement) {
  cancelAnimationFrame(rafId);
  document.removeEventListener("visibilitychange", onVisibility);
  if (heroWrap) heroWrap.removeEventListener("mousemove", onMouseMove);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (canvas?.parentElement) canvas.parentElement.removeChild(canvas);
  canvas = null;
  ctx = null;
  blobs = [];
  parallaxTarget = null;
}
