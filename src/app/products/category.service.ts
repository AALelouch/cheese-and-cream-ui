import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryResponse } from './category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/api/categories';

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.apiUrl);
  }

  createCategory(name: string): Observable<void> {
    const url = `${this.apiUrl}?categoryName=${encodeURIComponent(name)}`;
    return this.http.post<void>(url, null);
  }

  updateCategory(id: number, name: string): Observable<void> {
    const url = `${this.apiUrl}/${id}?categoryName=${encodeURIComponent(name)}`;
    return this.http.put<void>(url, null);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
