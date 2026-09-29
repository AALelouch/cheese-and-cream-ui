import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AgentService } from './agent.service';

describe('AgentService', () => {
  let service: AgentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AgentService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AgentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses role-scoped list and search endpoints with pagination', () => {
    service.getClients({ page: 1, size: 20, sort: ['name,asc'] }).subscribe();
    const clients = http.expectOne(request => request.url.endsWith('/api/agents/clients'));
    expect(clients.request.method).toBe('GET');
    expect(clients.request.params.get('page')).toBe('1');
    expect(clients.request.params.get('size')).toBe('20');
    clients.flush({ content: [] });

    service.searchProviders('ana', { page: 2, size: 10, sort: ['name,asc'] }).subscribe();
    const providers = http.expectOne(request => request.url.endsWith('/api/agents/search/providers'));
    expect(providers.request.method).toBe('POST');
    expect(providers.request.body).toEqual({ term: 'ana' });
    expect(providers.request.params.get('page')).toBe('2');
    expect(providers.request.params.get('sort')).toBe('name,asc');
    providers.flush({ content: [] });
  });
});
