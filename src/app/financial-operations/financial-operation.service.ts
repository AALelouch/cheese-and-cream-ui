import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FinancialOperationDetailsResponse,
  FinancialOperationRequest,
  FinancialOperationSummaryResponse
} from './financial-operation';
import { DEFAULT_PAGE_SIZE, PageRequest, PageResponse, toPageParams } from '../shared/pagination';
import { environment } from '../../environments/environment';

export const FINANCIAL_OPERATION_DEFAULT_SORT = ['creationDate,desc', 'id,desc'];

@Injectable({
  providedIn: 'root'
})
export class FinancialOperationService {
  private readonly apiUrl = environment.api.endpoints.financialOperations;

  constructor(private readonly http: HttpClient) {}

  getByAgentId(agentId: number, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: FINANCIAL_OPERATION_DEFAULT_SORT }): Observable<PageResponse<FinancialOperationSummaryResponse>> {
    return this.http.get<PageResponse<FinancialOperationSummaryResponse>>(`${this.apiUrl}/agent/${agentId}`, { params: toPageParams(request) });
  }

  searchOperations(agentId: number, term: string, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: FINANCIAL_OPERATION_DEFAULT_SORT }): Observable<PageResponse<FinancialOperationSummaryResponse>> {
    return this.http.post<PageResponse<FinancialOperationSummaryResponse>>(`${this.apiUrl}/agent/${agentId}/search`, { term }, { params: toPageParams(request) });
  }

  getOperationDetails(id: number): Observable<FinancialOperationDetailsResponse> {
    return this.http.get<FinancialOperationDetailsResponse>(`${this.apiUrl}/details/${id}`);
  }

  createOperation(request: FinancialOperationRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }
}
