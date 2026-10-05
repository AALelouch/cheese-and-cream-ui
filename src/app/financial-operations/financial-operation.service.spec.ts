import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FinancialOperationService } from './financial-operation.service';

describe('FinancialOperationService', () => {
  let service: FinancialOperationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FinancialOperationService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(FinancialOperationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a paged operation summary without requesting product lines', () => {
    service.getByAgentId(7, { page: 1, size: 20, sort: ['creationDate,desc'] }).subscribe();

    const request = http.expectOne(candidate => candidate.url.endsWith('/api/financial-operations/agent/7'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('sort')).toBe('creationDate,desc');
    request.flush({ content: [] });
  });

  it('loads product lines from the operation details endpoint', () => {
    const details = {
      products: [{ id: 9, name: 'Queso', quantity: 2, price: 12000, totalPrice: 24000 }]
    };
    let response: typeof details | undefined;

    service.getOperationDetails(42).subscribe(value => response = value);

    const request = http.expectOne(candidate => candidate.url.endsWith('/api/financial-operations/details/42'));
    expect(request.request.method).toBe('GET');
    request.flush(details);
    expect(response).toEqual(details);
  });
});
