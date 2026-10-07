import { authMode, automationBaseUrl } from './config';
import type { Problem } from './types';

export class ApiError extends Error {
  constructor(public problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
  }
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (!headers.has('Content-Type') && !(extra instanceof FormData)) {
    // leave unset for GET; set by callers for JSON body
  }
  if (authMode() === 'dev') {
    headers.set('X-Dev-Customer-Id', 'cust_1');
  } else {
    const token = import.meta.env.VITE_CUSTOMER_JWT?.trim();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export async function automationFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = authHeaders(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const url = `${automationBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let problem: Problem;
    try {
      problem = (await res.json()) as Problem;
    } catch {
      problem = {
        type: 'about:blank',
        title: res.statusText || 'Error',
        status: res.status,
        code: 'http_error',
        detail: await res.text().catch(() => undefined),
      };
    }
    throw new ApiError(problem);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
