import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then(module => module.Login) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(module => module.DashboardComponent), canActivate: [authGuard] },
  { path: 'agents', loadComponent: () => import('./agents/agents.component').then(module => module.AgentsComponent), canActivate: [authGuard] },
  { path: 'financial-operations', loadComponent: () => import('./financial-operations/financial-operations.component').then(module => module.FinancialOperationsComponent), canActivate: [authGuard] },
  { path: 'products', loadComponent: () => import('./products/products.component').then(module => module.ProductsComponent), canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
