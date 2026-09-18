import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinancialOperationRequest, FinancialOperationResponse } from './financial-operation';
import { DEFAULT_PAGE_SIZE, PageRequest, PageResponse, toPageParams } from '../shared/pagination';
import { environment } from '../../environments/environment';

export const FINANCIAL_OPERATION_DEFAULT_SORT = ['creationDate,desc', 'id,desc'];

@Injectable({
  providedIn: 'root'
})
export class FinancialOperationService {
  private readonly apiUrl = environment.api.endpoints.financialOperations;

  constructor(private readonly http: HttpClient) {}

  getByAgentId(agentId: number, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: FINANCIAL_OPERATION_DEFAULT_SORT }): Observable<PageResponse<FinancialOperationResponse>> {
    return this.http.get<PageResponse<FinancialOperationResponse>>(`${this.apiUrl}/agent/${agentId}`, { params: toPageParams(request) });
  }

  createOperation(request: FinancialOperationRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }
}
