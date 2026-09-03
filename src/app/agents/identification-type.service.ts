import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IdentificationTypeRequest, IdentificationTypeResponse } from './identification-type';

@Injectable({
  providedIn: 'root'
})
export class IdentificationTypeService {
  private apiUrl = 'http://localhost:8080/api/identity-types';

  constructor(private http: HttpClient) { }

  getAllIdentityTypes(): Observable<IdentificationTypeResponse[]> {
    return this.http.get<IdentificationTypeResponse[]>(this.apiUrl);
  }

  createIdentificationType(request: IdentificationTypeRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  updateIdentificationType(id: number, request: IdentificationTypeRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteIdentificationType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
