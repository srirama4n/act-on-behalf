export type AuthMode = 'dev' | 'jwt';

export const CUSTOMER_ID = 'cust_1';
export const DEV_STEPUP_TOKEN = 'dev-stepup-ok';

export function authMode(): AuthMode {
  return import.meta.env.VITE_AUTH_MODE === 'jwt' ? 'jwt' : 'dev';
}

/** Browser calls /api → Vite proxies to Automation Service. */
export function automationBaseUrl(): string {
  const configured = import.meta.env.VITE_AUTOMATION_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return '/api';
}

export function chatBaseUrl(): string {
  const configured = import.meta.env.VITE_CHAT_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return '';
}
