import { ApiClient, WidgetConfig } from "./api-client";
import { ICON_BOT, ICON_CHAT, ICON_CLOSE, ICON_SEND } from "./components/icons";
import { buildStyles } from "./styles";

const SESSION_KEY = "rag_embed_session_id";

function getScriptConfig(): Record<string, string> {
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script) return {};
  return {
    apiUrl: script.dataset.apiUrl || "",
    widgetKey: script.dataset.widgetKey || "",
    siteUrl: script.dataset.siteUrl || "",
    userId: script.dataset.userId || "",
    userEmail: script.dataset.userEmail || "",
    position: script.dataset.position || "bottom-right",
    primaryColor: script.dataset.primaryColor || "#4F46E5",
    title: script.dataset.title || "Ask us anything",
  };
}

function validateOrigin(siteUrl: string): boolean {
  if (!siteUrl) return true;
  try {
    const expected = new URL(siteUrl);
    const current = new URL(window.location.origin);
    if (expected.hostname === current.hostname) return true;
    if (current.hostname === "localhost" || current.hostname === "127.0.0.1") return true;
    if (current.hostname.endsWith(`.${expected.hostname}`)) return true;
    return false;
  } catch {
    return false;
  }
}

class RagEmbedWidget {
  private shadow: ShadowRoot;
  private api: ApiClient;
  private config: WidgetConfig | null = null;
  private sessionId: string;
  private messagesEl!: HTMLDivElement;
  private panel!: HTMLDivElement;
  private startersEl!: HTMLDivElement;
  private input!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;
  private bubble!: HTMLButtonElement;
  private hasUserMessage = false;

  constructor(private opts: Record<string, string>) {
    const host = document.createElement("div");
    host.id = "rag-embed-root";
    document.body.appendChild(host);
    this.shadow = host.attachShadow({ mode: "open" });
    this.sessionId = localStorage.getItem(SESSION_KEY) || crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, this.sessionId);
    this.api = new ApiClient(
      opts.apiUrl,
      opts.widgetKey,
      opts.siteUrl || window.location.origin,
      opts.userId,
      opts.userEmail
    );
  }

  async init() {
    if (this.opts.siteUrl && !validateOrigin(this.opts.siteUrl)) {
      console.error("RAG4All: origin does not match data-site-url");
      return;
    }
    try {
      this.config = await this.api.getConfig();
    } catch {
      this.config = {
        title: this.opts.title,
        primaryColor: this.opts.primaryColor,
        position: this.opts.position,
        starterQuestions: [],
        welcomeMessage: "Hi! How can I help?",
        siteUrl: this.opts.siteUrl,
        poweredBy: "RAG4All",
        showPoweredBy: true,
      };
      this.render(true);
      return;
    }
    this.render();
    window.addEventListener("message", (e) => {
      if (e.data?.type === "rag-embed-open") this.openPanel();
      if (e.data?.type === "rag-embed-close") this.closePanel();
    });
  }

  private openPanel() {
    this.panel.classList.add("open");
    this.bubble.classList.remove("pulse");
  }

  private closePanel() {
    this.panel.classList.remove("open");
    this.bubble.classList.add("pulse");
  }

  private render(apiDown = false) {
    const c = this.config!;
    const color = c.primaryColor || this.opts.primaryColor;
    const pos = c.position || this.opts.position;
    const side = pos === "bottom-left" ? "left" : "right";

    const style = document.createElement("style");
    style.textContent = buildStyles(color, pos);
    this.shadow.appendChild(style);

    this.bubble = document.createElement("button");
    this.bubble.className = `bubble ${side} pulse`;
    this.bubble.setAttribute("aria-label", "Open chat");
    this.bubble.innerHTML = ICON_CHAT;
    this.bubble.onclick = () => {
      if (this.panel.classList.contains("open")) this.closePanel();
      else this.openPanel();
    };

    this.panel = document.createElement("div");
    this.panel.className = `panel ${side}`;

    const header = document.createElement("div");
    header.className = "header";
    const headerText = document.createElement("div");
    headerText.className = "header-text";
    const title = document.createElement("div");
    title.className = "header-title";
    title.textContent = c.title || this.opts.title;
    const sub = document.createElement("div");
    sub.className = "header-sub";
    sub.textContent = "Answers from your documents";
    headerText.append(title, sub);
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.onclick = () => this.closePanel();
    header.append(headerText, closeBtn);

    this.messagesEl = document.createElement("div");
    this.messagesEl.className = "messages";
    this.addBotMessage(c.welcomeMessage);

    this.startersEl = document.createElement("div");
    this.startersEl.className = "starters";
    (c.starterQuestions || []).forEach((q) => {
      const btn = document.createElement("button");
      btn.className = "starter";
      btn.textContent = q;
      btn.onclick = () => this.send(q);
      this.startersEl.appendChild(btn);
    });

    const inputRow = document.createElement("div");
    inputRow.className = "input-row";
    this.input = document.createElement("input");
    this.input.placeholder = "Type a message...";
    this.input.setAttribute("aria-label", "Message");
    this.input.onkeydown = (e) => {
      if (e.key === "Enter" && !this.sendBtn.disabled) this.send(this.input.value);
    };
    this.sendBtn = document.createElement("button");
    this.sendBtn.className = "send-btn";
    this.sendBtn.setAttribute("aria-label", "Send message");
    this.sendBtn.innerHTML = ICON_SEND;
    this.sendBtn.onclick = () => this.send(this.input.value);
    inputRow.append(this.input, this.sendBtn);

    const showPowered = c.showPoweredBy !== false && c.poweredBy;
    let footer: HTMLElement | null = null;
    if (showPowered) {
      footer = document.createElement("div");
      footer.className = "powered-footer";
      footer.innerHTML = `Powered by <strong>${c.poweredBy || "RAG4All"}</strong>`;
    }

    if (footer) this.panel.append(header, this.messagesEl, this.startersEl, inputRow, footer);
    else this.panel.append(header, this.messagesEl, this.startersEl, inputRow);
    this.shadow.append(this.bubble, this.panel);

    if (apiDown) {
      this.addBotMessage("Chat is temporarily unavailable. Please try again in a moment.");
      this.input.disabled = true;
      this.sendBtn.disabled = true;
    }
  }

  private hideStarters() {
    if (this.hasUserMessage) this.startersEl.style.display = "none";
  }

  private addBotMessage(text: string, extraHtml = "") {
    const row = document.createElement("div");
    row.className = "msg-row";
    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = ICON_BOT;
    const msg = document.createElement("div");
    msg.className = "msg bot";
    msg.innerHTML = text.replace(/\n/g, "<br>") + extraHtml;
    row.append(avatar, msg);
    this.messagesEl.appendChild(row);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return msg;
  }

  private addUserMessage(text: string) {
    const row = document.createElement("div");
    row.className = "msg-row user";
    const msg = document.createElement("div");
    msg.className = "msg user";
    msg.textContent = text;
    row.appendChild(msg);
    this.messagesEl.appendChild(row);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private showTyping() {
    const row = document.createElement("div");
    row.className = "msg-row";
    row.id = "rag-typing-row";
    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = ICON_BOT;
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    row.append(avatar, typing);
    this.messagesEl.appendChild(row);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private hideTyping() {
    const el = this.shadow.getElementById("rag-typing-row");
    if (el) el.remove();
  }

  private async send(text: string) {
    if (!text.trim()) return;
    this.hasUserMessage = true;
    this.hideStarters();
    this.input.value = "";
    this.sendBtn.disabled = true;
    this.addUserMessage(text);

    let botEl: HTMLDivElement | null = null;
    let content = "";
    let lowConfidence = false;
    let gotBotResponse = false;
    let sources: Array<{ filename?: string }> = [];

    this.showTyping();

    try {
      for await (const event of this.api.chatStream(text, this.sessionId, (e) => {
        if (e.type === "confidence" && typeof e.confidence === "number" && e.confidence < 0.35) {
          lowConfidence = true;
        }
        if (e.type === "sources" && Array.isArray(e.sources)) {
          sources = e.sources as Array<{ filename?: string }>;
        }
      })) {
        if (event.type === "sources" && Array.isArray(event.sources)) {
          sources = event.sources as Array<{ filename?: string }>;
        }
        if (event.type === "token") {
          if (!gotBotResponse) {
            this.hideTyping();
            gotBotResponse = true;
            const row = document.createElement("div");
            row.className = "msg-row";
            const avatar = document.createElement("div");
            avatar.className = "msg-avatar";
            avatar.innerHTML = ICON_BOT;
            botEl = document.createElement("div");
            botEl.className = "msg bot";
            row.append(avatar, botEl);
            this.messagesEl.appendChild(row);
          }
          content += event.content as string;
          botEl!.textContent = content;
          this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        }
        if (event.type === "fallback") {
          this.hideTyping();
          gotBotResponse = true;
          this.addBotMessage(
            event.content as string,
            '<div class="low-confidence">Not found in your documents</div>'
          );
        }
        if (event.type === "done" && Array.isArray(event.sources)) {
          sources = event.sources as Array<{ filename?: string }>;
        }
      }

      this.hideTyping();
      if (!gotBotResponse) {
        this.addBotMessage("No response received. Please try again.");
      }
      if (botEl) {
        const filenames = [...new Set(sources.map((s) => s.filename).filter(Boolean))];
        if (filenames.length) {
          const chips = filenames
            .map((f) => `<span class="source-chip">${f}</span>`)
            .join("");
          botEl.innerHTML += `<div class="sources">${chips}</div>`;
        }
        if (lowConfidence && filenames.length) {
          botEl.innerHTML +=
            '<div class="low-confidence">Answer may be uncertain — verify against source documents.</div>';
        }
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      }
    } catch (err) {
      this.hideTyping();
      this.addBotMessage("Chat is temporarily unavailable. Please try again in a moment.");
      console.error("RAG4All widget:", err);
    }
    this.sendBtn.disabled = false;
  }
}

const opts = getScriptConfig();
if (opts.apiUrl && opts.widgetKey) {
  const widget = new RagEmbedWidget(opts);
  widget.init();
}

(window as unknown as { RagEmbed: { open: () => void; close: () => void } }).RagEmbed = {
  open: () => window.postMessage({ type: "rag-embed-open" }, "*"),
  close: () => window.postMessage({ type: "rag-embed-close" }, "*"),
};
