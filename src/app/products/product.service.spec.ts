import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ProductService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the lightweight product search endpoint with pagination', () => {
    service.searchProductIdNames(7, 'queso', { page: 2, size: 10, sort: ['name,asc'] }).subscribe();

    const request = http.expectOne(item => item.url.endsWith('/api/products/agent/7/search/id-name'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ term: 'queso' });
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('name,asc');
    request.flush({ content: [] });
  });
});
