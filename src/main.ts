import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app-routing.module';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { apiKeyInterceptorInterceptor } from './app/api-key-interceptor-interceptor';

registerLocaleData(localeEsCo);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiKeyInterceptorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ]
}).catch(err => console.error(err));
