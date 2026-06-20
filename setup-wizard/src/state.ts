import type { AppConfig } from "./config";

export interface HealthChecks {
  database?: boolean;
  minio?: boolean;
  llm?: { ok?: boolean; detail?: string };
  embedding_provider?: string;
  raw?: unknown;
}

export interface WizardState {
  step: number;
  siteUrl: string;
  provider: string;
  providerApiKey: string;
  baseUrl: string;
  llmTestOk: boolean;
  health: HealthChecks | null;
  documentsUploaded: boolean;
  collectionId: string | null;
}

export function createState(): WizardState {
  return {
    step: 1,
    siteUrl: "http://localhost:8080",
    provider: "openai",
    providerApiKey: "",
    baseUrl: "",
    llmTestOk: false,
    health: null,
    documentsUploaded: false,
    collectionId: null,
  };
}

let state = createState();
let config: AppConfig;

export function getState(): WizardState {
  return state;
}

export function setConfig(c: AppConfig) {
  config = c;
}

export function getConfig(): AppConfig {
  return config;
}

export function setStep(n: number) {
  state.step = n;
}

export function patchState(partial: Partial<WizardState>) {
  state = { ...state, ...partial };
}
