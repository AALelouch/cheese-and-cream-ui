import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardMetrics } from './dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/dashboard';

  getMonthlyMetrics(month: number): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/monthly/${month}`);
  }

  getTotalPendingBalance(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/pending-balance/total`);
  }

  getAgentPendingBalance(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/pending-balance/agent/${agentId}`);
  }

  getMonthlyPendingBalance(month: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/pending-balance/monthly/${month}`);
  }
}