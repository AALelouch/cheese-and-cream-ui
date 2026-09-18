import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductRequest, ProductResponse } from './product';
import { DEFAULT_PAGE_SIZE, PageRequest, PageResponse, toPageParams } from '../shared/pagination';
import { environment } from '../../environments/environment';

export const PRODUCT_DEFAULT_SORT = ['name,asc', 'id,asc'];

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = environment.api.endpoints.products;

  constructor(private readonly http: HttpClient) {}

  getProductsByAgentId(agentId: number, request: PageRequest = { page: 0, size: DEFAULT_PAGE_SIZE, sort: PRODUCT_DEFAULT_SORT }): Observable<PageResponse<ProductResponse>> {
    return this.http.get<PageResponse<ProductResponse>>(`${this.apiUrl}/agent/${agentId}`, { params: toPageParams(request) });
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
