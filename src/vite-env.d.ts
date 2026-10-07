/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSPORT?: 'mock' | 'http';
  readonly VITE_API_BASE?: string;
  readonly VITE_AUTH_MODE?: 'dev' | 'jwt';
  readonly VITE_AUTOMATION_BASE_URL?: string;
  readonly VITE_CHAT_BASE_URL?: string;
  readonly VITE_CUSTOMER_JWT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
