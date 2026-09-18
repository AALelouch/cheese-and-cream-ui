import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  submitted = false;
  isSubmitting = false;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  submit(): void {
    if (this.isSubmitting) return;
    this.submitted = true;
    if (!this.username.trim() || !this.password) return;

    this.isSubmitting = true;
    this.error = '';
    this.auth.login(this.username.trim(), this.password).pipe(finalize(() => {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error: HttpErrorResponse) => this.error = this.getLoginError(error.status)
    });
  }

  isUsernameInvalid(): boolean { return this.submitted && !this.username.trim(); }
  isPasswordInvalid(): boolean { return this.submitted && !this.password; }

  private getLoginError(status: number): string {
    if (status === 401) return 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
    if (status === 500) return 'Ocurrió un error del sistema. Inténtalo de nuevo más tarde.';
    return 'No fue posible iniciar sesión. Verifica tu conexión e inténtalo nuevamente.';
  }
}
