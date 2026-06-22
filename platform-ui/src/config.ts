export const PROVIDER_MODELS: Record<string, string> = {
  ollama: "llama3.2",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  gemini: "gemini-2.0-flash",
  custom: "gpt-4o-mini",
};

export const SETUP_STEPS = [
  { id: 1, name: "Website", illustration: "/assets/illustrations/step-website.svg", title: "Your website", desc: "Where visitors will see the chat widget." },
  { id: 2, name: "Services", illustration: "/assets/illustrations/step-services.svg", title: "Connect services", desc: "Verify API, storage, and AI are reachable." },
  { id: 3, name: "AI", illustration: "/assets/illustrations/step-ai.svg", title: "AI provider", desc: "Bring your own key and test your model." },
  { id: 4, name: "Documents", illustration: "/assets/illustrations/step-upload.svg", title: "Upload documents", desc: "Add PDFs and text files to your knowledge base." },
  { id: 5, name: "Go live", illustration: "/assets/illustrations/step-complete.svg", title: "Install & preview", desc: "Copy the embed snippet and preview your widget." },
];
