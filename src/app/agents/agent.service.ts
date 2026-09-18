import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgentRequest, AgentResponse } from './agent';
import { DEFAULT_PAGE_SIZE, PageRequest, PageResponse, toPageParams } from '../shared/pagination';
import { environment } from '../../environments/environment';

export const AGENT_DEFAULT_SORT = ['name,asc', 'id,asc'];

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private readonly apiUrl = environment.api.endpoints.agents;

  constructor(private readonly http: HttpClient) {}

  getAllAgents(request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: AGENT_DEFAULT_SORT }): Observable<PageResponse<AgentResponse>> {
    return this.http.get<PageResponse<AgentResponse>>(this.apiUrl, { params: toPageParams(request) });
  }

  createAgent(request: AgentRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  updateAgent(id: number, request: AgentRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteAgent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
