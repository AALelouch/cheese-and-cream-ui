import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { apiKeyInterceptorInterceptor } from './api-key-interceptor-interceptor';

describe('apiKeyInterceptorInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => apiKeyInterceptorInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
