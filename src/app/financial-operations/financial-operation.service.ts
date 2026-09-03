import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinancialOperationRequest, FinancialOperationResponse } from './financial-operation';

@Injectable({
  providedIn: 'root'
})
export class FinancialOperationService {
  private apiUrl = 'http://localhost:8080/api/financial-operations';

  constructor(private http: HttpClient) {}

  getByAgentId(agentId: number): Observable<FinancialOperationResponse[]> {
    return this.http.get<FinancialOperationResponse[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  createOperation(request: FinancialOperationRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }
}
