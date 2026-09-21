import { apiBaseUrlFromEnvironment, createEnvironment } from './environment.config';

export const environment = createEnvironment({
  production: false,
  apiBaseUrl: apiBaseUrlFromEnvironment('http://localhost:8080')
});
