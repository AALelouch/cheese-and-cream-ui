import { createEnvironment } from './environment.config';

// Production uses the same origin by default. Set the deployed API host here
// when the frontend and backend are served from different domains.
export const environment = createEnvironment({
  production: true,
  apiBaseUrl: ''
});
