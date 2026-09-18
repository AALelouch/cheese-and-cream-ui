import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse { apiKey: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const params = new HttpParams().set('username', username).set('password', password);
    return this.http.post<LoginResponse>(environment.api.endpoints.login, null, { params }).pipe(
      tap(({ apiKey }) => this.setApiKey(apiKey))
    );
  }

  getApiKey(): string | null {
    return isPlatformBrowser(this.platformId) ? sessionStorage.getItem(environment.auth.storageKey) : null;
  }

  isAuthenticated(): boolean { return this.getApiKey() !== null; }

  logout(redirect = true): void {
    if (isPlatformBrowser(this.platformId)) sessionStorage.removeItem(environment.auth.storageKey);
    if (redirect) void this.router.navigate(['/login']);
  }

  private setApiKey(apiKey: string): void {
    if (isPlatformBrowser(this.platformId)) sessionStorage.setItem(environment.auth.storageKey, apiKey);
  }
}
