/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dynamic embedded wallet — required for Owner connect in the browser. */
  readonly VITE_DYNAMIC_ENVIRONMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
