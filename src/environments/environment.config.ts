export interface ApiEndpoints {
  readonly login: string;
  readonly agents: string;
  readonly identityTypes: string;
  readonly products: string;
  readonly categories: string;
  readonly financialOperations: string;
  readonly dashboard: string;
}

export interface AppEnvironment {
  readonly production: boolean;
  readonly api: {
    readonly baseUrl: string;
    readonly rootUrl: string;
    readonly endpoints: ApiEndpoints;
  };
  readonly auth: {
    readonly storageKey: string;
    readonly authorizationScheme: string;
  };
}

interface EnvironmentOptions {
  readonly production: boolean;
  readonly apiBaseUrl: string;
}

declare global {
  interface Window {
    __env?: {
      API_BASE_URL?: string;
    };
  }
}

const API_PATHS = {
  login: '/api/login',
  agents: '/api/agents',
  identityTypes: '/api/identity-types',
  products: '/api/products',
  categories: '/api/categories',
  financialOperations: '/api/financial-operations',
  dashboard: '/api/dashboard'
} as const;

const AUTH_STORAGE_KEY = 'cheeseandcream.apiKey';
const AUTHORIZATION_SCHEME = 'Basic';

export function apiBaseUrlFromEnvironment(fallback: string): string {
  if (typeof window === 'undefined') return fallback;

  return window.__env?.API_BASE_URL?.trim() || fallback;
}

export function createEnvironment({ production, apiBaseUrl }: EnvironmentOptions): AppEnvironment {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, '');
  const buildApiUrl = (path: string): string => `${normalizedBaseUrl}${path}`;

  return {
    production,
    api: {
      baseUrl: normalizedBaseUrl,
      rootUrl: buildApiUrl('/api'),
      endpoints: {
        login: buildApiUrl(API_PATHS.login),
        agents: buildApiUrl(API_PATHS.agents),
        identityTypes: buildApiUrl(API_PATHS.identityTypes),
        products: buildApiUrl(API_PATHS.products),
        categories: buildApiUrl(API_PATHS.categories),
        financialOperations: buildApiUrl(API_PATHS.financialOperations),
        dashboard: buildApiUrl(API_PATHS.dashboard)
      }
    },
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      authorizationScheme: AUTHORIZATION_SCHEME
    }
  };
}
