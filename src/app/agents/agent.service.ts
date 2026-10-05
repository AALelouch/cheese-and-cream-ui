import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgentIdNameResponse, AgentResponse, AgentUpsertRequest } from './agent';
import { DEFAULT_PAGE_SIZE, PageRequest, PageResponse, toPageParams } from '../shared/pagination';
import { environment } from '../../environments/environment';

export const AGENT_DEFAULT_SORT = ['name,asc', 'id,asc'];

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private readonly apiUrl = environment.api.endpoints.agents;

  constructor(private readonly http: HttpClient) {}

  getClients(request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: AGENT_DEFAULT_SORT }): Observable<PageResponse<AgentResponse>> {
    return this.http.get<PageResponse<AgentResponse>>(`${this.apiUrl}/clients`, { params: toPageParams(request) });
  }

  searchClients(term: string, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: AGENT_DEFAULT_SORT }): Observable<PageResponse<AgentResponse>> {
    return this.http.post<PageResponse<AgentResponse>>(`${this.apiUrl}/search/clients`, { term }, { params: toPageParams(request) });
  }

  getProviders(request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: AGENT_DEFAULT_SORT }): Observable<PageResponse<AgentResponse>> {
    return this.http.get<PageResponse<AgentResponse>>(`${this.apiUrl}/providers`, { params: toPageParams(request) });
  }

  searchProviders(term: string, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: AGENT_DEFAULT_SORT }): Observable<PageResponse<AgentResponse>> {
    return this.http.post<PageResponse<AgentResponse>>(`${this.apiUrl}/search/providers`, { term }, { params: toPageParams(request) });
  }

  searchClientIdNames(term: string, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: AGENT_DEFAULT_SORT }): Observable<PageResponse<AgentIdNameResponse>> {
    return this.http.post<PageResponse<AgentIdNameResponse>>(`${this.apiUrl}/search/id-name/clients`, { term }, { params: toPageParams(request) });
  }

  searchProviderIdNames(term: string, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: AGENT_DEFAULT_SORT }): Observable<PageResponse<AgentIdNameResponse>> {
    return this.http.post<PageResponse<AgentIdNameResponse>>(`${this.apiUrl}/search/id-name/providers`, { term }, { params: toPageParams(request) });
  }

  getAgent(id: number): Observable<AgentResponse> {
    return this.http.get<AgentResponse>(`${this.apiUrl}/${id}`);
  }

  createAgent(request: AgentUpsertRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  updateAgent(id: number, request: AgentUpsertRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteAgent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
