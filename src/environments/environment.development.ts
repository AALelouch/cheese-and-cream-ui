import { createEnvironment } from './environment.config';

export const environment = createEnvironment({
  production: false,
  apiBaseUrl: 'http://localhost:8080'
});
