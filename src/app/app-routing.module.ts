import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AgentsComponent } from './agents/agents.component';
import { FinancialOperationsComponent } from './financial-operations/financial-operations.component';
import { ProductsComponent } from './products/products.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'agents', component: AgentsComponent },
  { path: 'financial-operations', component: FinancialOperationsComponent },
  { path: 'products', component: ProductsComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
