import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryResponse } from './category';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = environment.api.endpoints.categories;

  constructor(private readonly http: HttpClient) {}

  getAllCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.apiUrl);
  }

  createCategory(name: string): Observable<void> {
    const params = new HttpParams().set('categoryName', name);
    return this.http.post<void>(this.apiUrl, null, { params });
  }

  updateCategory(id: number, name: string): Observable<void> {
    const params = new HttpParams().set('categoryName', name);
    return this.http.put<void>(`${this.apiUrl}/${id}`, null, { params });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
