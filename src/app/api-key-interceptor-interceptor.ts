import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { environment } from '../environments/environment';

export const apiKeyInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiKey = auth.getApiKey();
  const requestUrl = req.url.split('?')[0];
  const isApiRequest = requestUrl === environment.api.rootUrl || requestUrl.startsWith(`${environment.api.rootUrl}/`);
  const isLogin = requestUrl === environment.api.endpoints.login;

  const modifiedReq = apiKey && isApiRequest && !isLogin
    ? req.clone({ setHeaders: { Authorization: `${environment.auth.authorizationScheme} ${apiKey}` } })
    : req;

  return next(modifiedReq).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401 && isApiRequest && !isLogin) {
      auth.logout(false);
      void router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};
