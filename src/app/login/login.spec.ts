import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let auth: { login: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { login: vi.fn(() => of({ apiKey: 'key' })) };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } }
      ]
    }).compileComponents();
    component = TestBed.createComponent(Login).componentInstance;
  });

  it('validates required credentials before calling authentication', () => {
    component.username = '   ';
    component.submit();

    expect(component.submitted).toBe(true);
    expect(component.isUsernameInvalid()).toBe(true);
    expect(component.isPasswordInvalid()).toBe(true);
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('trims the username and redirects after a successful login', () => {
    component.username = '  ana  ';
    component.password = 'secret';
    component.submit();

    expect(auth.login).toHaveBeenCalledWith('ana', 'secret');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.isSubmitting).toBe(false);
  });

  it('shows the credential-specific message for an unauthorized login', () => {
    auth.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.username = 'ana';
    component.password = 'incorrecta';
    component.submit();

    expect(component.error).toBe('Credenciales incorrectas. Verifica tu usuario y contraseña.');
    expect(component.isSubmitting).toBe(false);
  });

  it('does not start another request while one is pending', () => {
    component.isSubmitting = true;
    component.username = 'ana';
    component.password = 'secret';
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
  });
});
