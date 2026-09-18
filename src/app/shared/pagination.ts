import { HttpParams } from '@angular/common/http';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageRequest {
  page: number;
  size: number;
  sort?: string[];
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const DEFAULT_PAGE_SIZE = 10;

export function createPaginationState(pageSize = DEFAULT_PAGE_SIZE): PaginationState {
  return {
    page: 0,
    pageSize,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  };
}

export function updatePaginationState(state: PaginationState, response: PageResponse<unknown>): void {
  state.page = response.number;
  state.pageSize = response.size;
  state.totalElements = response.totalElements;
  state.totalPages = response.totalPages;
  state.first = response.first;
  state.last = response.last;
}

export function toPageParams(request: PageRequest): HttpParams {
  let params = new HttpParams().set('page', request.page).set('size', request.size);
  for (const sort of request.sort ?? []) params = params.append('sort', sort);
  return params;
}
