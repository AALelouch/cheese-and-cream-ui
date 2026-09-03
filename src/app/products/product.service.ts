import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductRequest, ProductResponse } from './product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  getProductsByAgentId(agentId: number): Observable<ProductResponse[] | { content?: ProductResponse[] }> {
    return this.http.get<ProductResponse[] | { content?: ProductResponse[] }>(`${this.apiUrl}/agent/${agentId}`);
  }

  createProduct(request: ProductRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  updateProduct(id: number, request: ProductRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
