import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AgentService } from './agent.service';
import { AgentsComponent } from './agents.component';
import { IdentificationTypeService } from './identification-type.service';

registerLocaleData(localeEsCo);

const page = <T>(content: T[], number = 0) => ({ content, number, totalElements: content.length, totalPages: 1, size: 10, numberOfElements: content.length, first: true, last: true, empty: !content.length });
const agent = { id: 4, name: '  María ', email: 'maria@example.com', phoneNumber: '', address: '', receivables: '12', payables: '0', balance: '12', role: 'CLIENT' as const, identificationType: '2', identificationNumber: '123' };

describe('AgentsComponent', () => {
  let component: AgentsComponent;
  let agentService: { getClients: ReturnType<typeof vi.fn>; searchClients: ReturnType<typeof vi.fn>; getProviders: ReturnType<typeof vi.fn>; searchProviders: ReturnType<typeof vi.fn>; createAgent: ReturnType<typeof vi.fn>; updateAgent: ReturnType<typeof vi.fn>; deleteAgent: ReturnType<typeof vi.fn> };
  let typeService: { getAllIdentityTypes: ReturnType<typeof vi.fn>; createIdentificationType: ReturnType<typeof vi.fn>; updateIdentificationType: ReturnType<typeof vi.fn>; deleteIdentificationType: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    agentService = { getClients: vi.fn(() => of(page([]))), searchClients: vi.fn(() => of(page([]))), getProviders: vi.fn(() => of(page([]))), searchProviders: vi.fn(() => of(page([]))), createAgent: vi.fn(() => of(void 0)), updateAgent: vi.fn(() => of(void 0)), deleteAgent: vi.fn(() => of(void 0)) };
    typeService = { getAllIdentityTypes: vi.fn(() => of([])), createIdentificationType: vi.fn(() => of(void 0)), updateIdentificationType: vi.fn(() => of(void 0)), deleteIdentificationType: vi.fn(() => of(void 0)) };
    TestBed.configureTestingModule({ imports: [AgentsComponent], providers: [
      { provide: AgentService, useValue: agentService }, { provide: BsModalService, useValue: { show: vi.fn(() => ({ hide: vi.fn() })) } },
      { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } }, { provide: ActivatedRoute, useValue: { snapshot: { data: { role: 'CLIENT' } } } }
    ] });
    TestBed.overrideComponent(AgentsComponent, { remove: { providers: [IdentificationTypeService] }, add: { providers: [{ provide: IdentificationTypeService, useValue: typeService }] } });
    await TestBed.compileComponents();
    component = TestBed.createComponent(AgentsComponent).componentInstance;
  });

  it('requires name and identification type before saving an agent', () => {
    component.saveAgent();
    expect(component.agentError).toBe('El nombre es obligatorio.');
    component.agentForm.name = 'María';
    component.saveAgent();
    expect(component.agentError).toBe('Selecciona un tipo de identificacion.');
    expect(agentService.createAgent).not.toHaveBeenCalled();
  });

  it('trims data and uses update for an agent being edited', () => {
    component.editingAgentId = 4;
    component.agentForm = { name: '  María ', email: 'maria@example.com', phoneNumber: '', address: '', receivables: 12, payables: 0, identificationTypeId: 2, role: 'CLIENT', identificationNumber: '123' };
    component.saveAgent();

    expect(agentService.updateAgent).toHaveBeenCalledWith(4, expect.objectContaining({ name: 'María', receivables: 12, payables: 0, role: 'CLIENT' }));
    expect(agentService.createAgent).not.toHaveBeenCalled();
  });

  it('resolves numeric and named identification types for display and edit forms', () => {
    component.identificationTypes = [{ id: 2, name: 'Cédula' }];
    expect(component.getAgentIdentificationType(agent)).toBe('Cédula');
    component.openEditAgentModal({} as never, { ...agent, identificationType: 'Cédula', identificationTypeId: undefined });
    expect(component.agentForm.identificationTypeId).toBe(2);
  });

  it('keeps a newer page result when an older request completes later', () => {
    const first = new Subject<ReturnType<typeof page>>();
    const second = new Subject<ReturnType<typeof page>>();
    agentService.getClients.mockImplementation((request: { page: number }) => request.page === 0 ? first : second);
    component.loadAgents(0);
    component.loadAgents(1);
    first.next(page([{ ...agent, id: 1 }], 0));
    expect(component.agents).toEqual([]);
    second.next(page([{ ...agent, id: 2 }], 1));
    expect(component.agents.map(item => item.id)).toEqual([2]);
  });

  it('retains an actionable error if the agents API fails', () => {
    agentService.getClients.mockReturnValue(throwError(() => new Error('offline')));
    component.loadAgents();
    expect(component.agentsLoadError).toBe('No se pudieron cargar los agentes.');
  });
});
