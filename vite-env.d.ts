/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_FORCE_API?: string;
  readonly VITE_DEPLOY_URL?: string;
  readonly GEMINI_API_KEY?: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
