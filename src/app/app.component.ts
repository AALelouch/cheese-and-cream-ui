import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'cheese-and-cream-ui';
  isNavigationOpen = false;

  constructor(private readonly router: Router, private readonly auth: AuthService) {}

  get isLoginPage(): boolean { return this.router.url.startsWith('/login'); }

  toggleNavigation(): void {
    this.isNavigationOpen = !this.isNavigationOpen;
  }

  closeNavigation(): void {
    this.isNavigationOpen = false;
  }

  logout(): void { this.closeNavigation(); this.auth.logout(); }
}
