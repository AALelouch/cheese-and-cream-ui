import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgentRequest, AgentResponse } from './agent';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private apiUrl = 'http://localhost:8080/api/agents';

  constructor(private http: HttpClient) {}

  getAllAgents(): Observable<AgentResponse[] | { content?: AgentResponse[] }> {
    return this.http.get<AgentResponse[] | { content?: AgentResponse[] }>(this.apiUrl);
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
