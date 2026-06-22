export const TOKENS_CSS = `
:root {
  --rag-primary: #5b4fe8;
  --rag-primary-hover: #4a3ed6;
  --rag-bg: #f8fafc;
  --rag-surface: #ffffff;
  --rag-text: #0f172a;
  --rag-text-muted: #64748b;
  --rag-border: #e2e8f0;
  --rag-bot-bg: #f1f5f9;
  --rag-warning: #92400e;
  --rag-warning-bg: #fef3c7;
  --rag-bubble-bg: #e0e7ff;
  --rag-bubble-hover: #c7d2fe;
  --rag-font: system-ui, -apple-system, "Segoe UI", sans-serif;
}
`;

export const PANEL_CSS = `
:host { all: initial; font-family: var(--rag-font); }
.bubble {
  position: fixed; bottom: 20px; width: 56px; height: 56px;
  border-radius: 50%; background: var(--rag-bubble-bg); color: var(--rag-primary);
  border: 1px solid #c7d2fe; cursor: pointer; z-index: 999999;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.22);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s, background 0.2s;
}
.bubble svg { width: 26px; height: 26px; }
.bubble:hover {
  transform: scale(1.05);
  background: var(--rag-bubble-hover);
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.3);
}
.bubble.right { right: 20px; left: auto; }
.bubble.left { left: 20px; right: auto; }
@media (prefers-reduced-motion: no-preference) {
  .bubble.pulse { animation: rag-pulse 2.5s ease-in-out infinite; }
}
@keyframes rag-pulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(99, 102, 241, 0.22); }
  50% { box-shadow: 0 4px 28px rgba(99, 102, 241, 0.38); }
}
.panel {
  position: fixed; bottom: 90px; width: 400px; max-width: calc(100vw - 32px);
  height: 540px; max-height: 72vh; background: var(--rag-surface);
  border-radius: 16px; box-shadow: 0 12px 48px rgba(15, 23, 42, 0.18);
  display: none; flex-direction: column; z-index: 999999;
  overflow: hidden; border: 1px solid var(--rag-border);
  animation: rag-slide-up 0.25s ease;
}
.panel.right { right: 20px; left: auto; }
.panel.left { left: 20px; right: auto; }
.panel.open { display: flex; }
@keyframes rag-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.header {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  color: var(--rag-text);
  padding: 16px 16px 14px; display: flex; align-items: flex-start; gap: 12px;
  border-bottom: 1px solid var(--rag-border);
}
.header-text { flex: 1; min-width: 0; }
.header-title { font-weight: 600; font-size: 15px; line-height: 1.3; color: var(--rag-text); }
.header-sub { font-size: 12px; color: var(--rag-text); margin-top: 2px; }
.close-btn {
  background: rgba(15, 23, 42, 0.06); border: none; color: var(--rag-text);
  width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.close-btn svg { width: 18px; height: 18px; }
.close-btn:hover { background: rgba(15, 23, 42, 0.1); }
`;

export const MESSAGES_CSS = `
.messages {
  flex: 1; overflow-y: auto; padding: 16px; display: flex;
  flex-direction: column; gap: 12px; background: var(--rag-bg);
}
.msg-row { display: flex; gap: 8px; align-items: flex-end; max-width: 100%; }
.msg-row.user { justify-content: flex-end; }
.msg-avatar {
  width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%;
  overflow: hidden; align-self: flex-end;
}
.msg-avatar svg { width: 28px; height: 28px; display: block; }
.msg {
  padding: 10px 14px; border-radius: 14px; max-width: 82%;
  line-height: 1.45; font-size: 14px; word-break: break-word;
}
.msg.user {
  background: var(--rag-primary); color: #fff;
  border-bottom-right-radius: 4px;
}
.msg.bot {
  background: var(--rag-surface); color: var(--rag-text);
  border: 1px solid var(--rag-border); border-bottom-left-radius: 4px;
}
.typing {
  display: flex; gap: 4px; padding: 12px 14px; align-items: center;
  background: var(--rag-surface); border: 1px solid var(--rag-border);
  border-radius: 14px; border-bottom-left-radius: 4px;
}
.typing span {
  width: 6px; height: 6px; background: var(--rag-text-muted);
  border-radius: 50%; animation: rag-bounce 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes rag-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
.sources { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.source-chip {
  font-size: 11px; padding: 3px 8px; border-radius: 10px;
  background: var(--rag-bg); color: var(--rag-text-muted);
  border: 1px solid var(--rag-border);
}
.low-confidence {
  font-size: 11px; color: var(--rag-warning); background: var(--rag-warning-bg);
  padding: 6px 10px; border-radius: 8px; margin-top: 6px;
}
.starters {
  display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px 4px;
  border-top: 1px solid var(--rag-border); background: var(--rag-surface);
}
.starter {
  font-size: 12px; padding: 6px 12px; border-radius: 16px;
  border: 1px solid var(--rag-border); background: var(--rag-surface);
  color: var(--rag-primary); cursor: pointer; transition: all 0.15s;
}
.starter:hover { background: #eef2ff; border-color: var(--rag-primary); }
.input-row {
  display: flex; border-top: 1px solid var(--rag-border);
  padding: 12px; gap: 8px; background: var(--rag-surface);
}
.input-row input {
  flex: 1; border: 1px solid var(--rag-border); border-radius: 10px;
  padding: 10px 14px; font-size: 14px; font-family: inherit;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.input-row input:focus {
  border-color: var(--rag-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}
.send-btn {
  background: var(--rag-primary); color: #fff; border: none;
  width: 44px; height: 44px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background 0.15s;
}
.send-btn svg { width: 20px; height: 20px; }
.send-btn:hover { background: var(--rag-primary-hover); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.powered-footer {
  text-align: center; font-size: 11px; color: var(--rag-text-muted);
  padding: 6px 12px 8px; background: var(--rag-surface);
  border-top: 1px solid var(--rag-border);
}
.powered-footer a { color: var(--rag-text-muted); text-decoration: none; }
.powered-footer a:hover { color: var(--rag-primary); }
`;

export function buildStyles(primaryColor: string, position: string): string {
  return (
    TOKENS_CSS.replace("--rag-primary: #4f46e5", `--rag-primary: ${primaryColor}`) +
    PANEL_CSS +
    MESSAGES_CSS.replace(/var\(--rag-primary\)/g, primaryColor)
  );
}
