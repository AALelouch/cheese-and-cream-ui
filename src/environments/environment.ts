import { apiBaseUrlFromEnvironment, createEnvironment } from './environment.config';

export const environment = createEnvironment({
  production: true,
  apiBaseUrl: apiBaseUrlFromEnvironment('')
});
