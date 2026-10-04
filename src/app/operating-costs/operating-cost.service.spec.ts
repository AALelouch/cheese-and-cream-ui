import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OperatingCostService } from './operating-cost.service';

describe('OperatingCostService', () => {
  let service: OperatingCostService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [OperatingCostService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OperatingCostService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the operating-cost list and search endpoints with page parameters', () => {
    service.getOperatingCosts({ page: 1, size: 20, sort: ['date,desc'] }).subscribe();
    const list = http.expectOne(request => request.url.endsWith('/api/operating-cost'));
    expect(list.request.method).toBe('GET');
    expect(list.request.params.get('page')).toBe('1');
    expect(list.request.params.get('size')).toBe('20');
    expect(list.request.params.get('sort')).toBe('date,desc');
    list.flush({ content: [] });

    service.searchOperatingCosts('arriendo', { page: 2, size: 10 }).subscribe();
    const search = http.expectOne(request => request.url.endsWith('/api/operating-cost/search'));
    expect(search.request.method).toBe('POST');
    expect(search.request.body).toEqual({ term: 'arriendo' });
    expect(search.request.params.get('page')).toBe('2');
    expect(search.request.params.get('size')).toBe('10');
    search.flush({ content: [] });
  });

  it('uses the month and year endpoint with page parameters', () => {
    service.getOperatingCostsByMonth(9, 2026, { page: 1, size: 20, sort: ['date,desc'] }).subscribe();

    const request = http.expectOne(candidate => candidate.url.endsWith('/api/operating-cost/month/9/2026'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('sort')).toBe('date,desc');
    request.flush({ content: [] });
  });

  it('uses the contract-specific create, update, and delete paths', () => {
    const request = { concept: 'Arriendo', amount: 1200000 };

    service.createOperatingCost(request).subscribe();
    const create = http.expectOne(request => request.url.endsWith('/api/operating-cost'));
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(request);
    create.flush(null);

    service.updateOperatingCost(17, request).subscribe();
    const update = http.expectOne(request => request.url.endsWith('/api/operating-cost/update/17'));
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(request);
    update.flush(null, { status: 204, statusText: 'No Content' });

    service.deleteOperatingCost(17).subscribe();
    const remove = http.expectOne(request => request.url.endsWith('/api/operating-cost/delete/17'));
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
});
