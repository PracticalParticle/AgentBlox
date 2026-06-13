/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DYNAMIC_ENVIRONMENT_ID: string;
  readonly VITE_SEPOLIA_RPC_URL: string;
  readonly VITE_LIFI_INTEGRATOR: string;
  readonly VITE_TREASURY_ADDRESS: string;
  readonly VITE_ENS_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
