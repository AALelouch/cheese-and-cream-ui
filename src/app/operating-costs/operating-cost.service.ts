import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DEFAULT_PAGE_SIZE, PageRequest, PageResponse, toPageParams } from '../shared/pagination';
import { OperatingCostRequest, OperatingCostResponse } from './operating-cost';

@Injectable({ providedIn: 'root' })
export class OperatingCostService {
  private readonly apiUrl = environment.api.endpoints.operatingCosts;

  constructor(private readonly http: HttpClient) {}

  getOperatingCosts(request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE }): Observable<PageResponse<OperatingCostResponse>> {
    return this.http.get<PageResponse<OperatingCostResponse>>(this.apiUrl, { params: toPageParams(request) });
  }

  getOperatingCostsByMonth(month: number, year: number, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE }): Observable<PageResponse<OperatingCostResponse>> {
    return this.http.get<PageResponse<OperatingCostResponse>>(`${this.apiUrl}/month/${month}/${year}`, { params: toPageParams(request) });
  }

  searchOperatingCosts(term: string, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE }): Observable<PageResponse<OperatingCostResponse>> {
    return this.http.post<PageResponse<OperatingCostResponse>>(`${this.apiUrl}/search`, { term }, { params: toPageParams(request) });
  }

  createOperatingCost(request: OperatingCostRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  updateOperatingCost(id: number, request: OperatingCostRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/update/${id}`, request);
  }

  deleteOperatingCost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
