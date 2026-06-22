export interface WidgetConfig {
  title: string;
  primaryColor: string;
  position: string;
  starterQuestions: string[];
  welcomeMessage: string;
  siteUrl: string;
  widgetKey?: string;
  poweredBy?: string;
  showPoweredBy?: boolean;
}

export class ApiClient {
  constructor(
    private apiUrl: string,
    private widgetKey: string,
    private siteUrl: string,
    private userId?: string,
    private userEmail?: string
  ) {}

  async getConfig(): Promise<WidgetConfig> {
    const res = await fetch(`${this.apiUrl}/v1/widget/config`, {
      headers: {
        "X-Widget-Key": this.widgetKey,
        Origin: this.siteUrl,
      },
    });
    if (!res.ok) throw new Error("Failed to load widget config");
    return res.json();
  }

  async *chatStream(message: string, sessionId: string, onEvent?: (e: Record<string, unknown>) => void) {
    const res = await fetch(`${this.apiUrl}/v1/widget/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Widget-Key": this.widgetKey,
        Origin: window.location.origin,
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        user_id: this.userId,
        user_email: this.userEmail,
        page_url: window.location.href,
        stream: true,
      }),
    });

    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    const processEventBlock = (block: string) => {
      const lines = block.split("\n");
      let eventType = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      if (!data) return;
      const parsed = JSON.parse(data);
      onEvent?.(parsed);
      if (eventType === "token" || parsed.type === "token") return parsed;
      if (parsed.type === "fallback") return parsed;
      if (parsed.type === "done") return parsed;
      return null;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const event = processEventBlock(part);
          if (event) yield event;
        }
      }
      if (done) {
        buffer = buffer.replace(/\r\n/g, "\n");
        if (buffer.trim()) {
          const event = processEventBlock(buffer);
          if (event) yield event;
        }
        break;
      }
    }
  }
}
