import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideLayoutDashboard, LucideMenu, LucidePackage, LucideReceiptText, LucideUsersRound, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    LucideLayoutDashboard,
    LucideMenu,
    LucidePackage,
    LucideReceiptText,
    LucideUsersRound,
    LucideX
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'cheese-and-cream-ui';
  isNavigationOpen = false;

  toggleNavigation(): void {
    this.isNavigationOpen = !this.isNavigationOpen;
  }

  closeNavigation(): void {
    this.isNavigationOpen = false;
  }
}
