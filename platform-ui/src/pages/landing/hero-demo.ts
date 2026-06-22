let timers: ReturnType<typeof setTimeout>[] = [];
let running = false;

const DEMO_SCRIPT = [
  { role: "user", text: "What are your pricing plans?" },
  { role: "bot", text: "We offer Starter, Pro, and Enterprise tiers. See our pricing page for details.", source: "pricing.pdf" },
];

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
}

function addMessage(container: HTMLElement, role: "user" | "bot", text: string, source?: string) {
  const row = el("div", `landing-hero-msg landing-hero-msg-${role}`);
  row.textContent = text;
  if (role === "bot" && source) {
    const chip = el("span", "landing-hero-source-chip", source);
    row.appendChild(chip);
  }
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function typeText(el: HTMLElement, text: string, speed: number): Promise<void> {
  return new Promise((resolve) => {
    el.textContent = "";
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        timers.push(setTimeout(tick, speed));
      } else {
        resolve();
      }
    };
    tick();
  });
}

async function runLoop(messagesEl: HTMLElement, panel: HTMLElement, bubble: HTMLElement) {
  if (!running) return;
  bubble.classList.remove("open");
  panel.classList.remove("open");
  messagesEl.innerHTML = "";

  await delay(1200);
  if (!running) return;
  bubble.classList.add("open");
  panel.classList.add("open");

  await delay(400);
  if (!running) return;

  for (const msg of DEMO_SCRIPT) {
    if (!running) return;
    if (msg.role === "user") {
      addMessage(messagesEl, "user", msg.text);
      await delay(600);
    } else {
      const row = el("div", "landing-hero-msg landing-hero-msg-bot");
      messagesEl.appendChild(row);
      await typeText(row, msg.text, 28);
      if (msg.source) {
        row.appendChild(el("span", "landing-hero-source-chip", msg.source));
      }
      await delay(2200);
    }
  }

  await delay(1500);
  if (running) runLoop(messagesEl, panel, bubble);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => timers.push(setTimeout(r, ms)));
}

export function initHeroChatDemo(root: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const panel = root.querySelector(".landing-hero-chat-panel");
    const bubble = root.querySelector(".landing-hero-chat-bubble");
    panel?.classList.add("open");
    bubble?.classList.add("open");
    const messagesEl = root.querySelector(".landing-hero-chat-messages") as HTMLElement;
    if (messagesEl) {
      addMessage(messagesEl, "user", DEMO_SCRIPT[0].text);
      addMessage(messagesEl, "bot", DEMO_SCRIPT[1].text, DEMO_SCRIPT[1].source);
    }
    return;
  }

  const messagesEl = root.querySelector(".landing-hero-chat-messages") as HTMLElement;
  const panel = root.querySelector(".landing-hero-chat-panel") as HTMLElement;
  const bubble = root.querySelector(".landing-hero-chat-bubble") as HTMLElement;
  if (!messagesEl || !panel || !bubble) return;

  running = true;
  bubble.classList.add("pulse");
  timers.push(setTimeout(() => {
    bubble.classList.remove("pulse");
    runLoop(messagesEl, panel, bubble);
  }, 1500));
}

export function destroyHeroChatDemo() {
  running = false;
  clearTimers();
}
