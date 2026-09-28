import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { AGENT_ROLE_LABEL, AgentResponse, AgentRole, AgentUpsertRequest } from './agent';
import { CommonModule } from '@angular/common';
import { IdentificationTypeService } from './identification-type.service';
import { IdentificationTypeRequest, IdentificationTypeResponse } from './identification-type';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, Subject, switchMap, timeout } from 'rxjs';
import { AgentService, AGENT_DEFAULT_SORT } from './agent.service';
import { createPaginationState, DEFAULT_PAGE_SIZE, updatePaginationState } from '../shared/pagination';
import { removeById, replaceById } from '../shared/collection';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css'],
  providers: [IdentificationTypeService]
})
export class AgentsComponent implements OnInit {
  readonly role: AgentRole;
  agents: AgentResponse[] = [];
  identificationTypes: IdentificationTypeResponse[] = [];
  modalRef?: BsModalRef;
  newIdentificationTypeName = '';
  isSavingIdentificationType = false;
  identificationTypeError = '';
  editingIdentificationTypeId: number | null = null;
  editingIdentificationTypeName = '';
  isSavingAgent = false;
  agentError = '';
  agentForm: AgentUpsertRequest = {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    receivables: 0,
    payables: 0,
    identificationTypeId: 0,
    role: 'CLIENT',
    identificationNumber: ''
  };
  agentFormSubmitted = false;
  editingAgentId: number | null = null;
  pagination = createPaginationState();
  searchTerm = '';
  isLoadingAgents = false;
  agentsLoadError = '';
  private agentsRequestId = 0;
  private readonly agentSearchTerms = new Subject<string>();

  constructor(
    private identificationTypeService: IdentificationTypeService,
    private agentService: AgentService,
    private modalService: BsModalService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    route: ActivatedRoute
  ) { this.role = route.snapshot.data['role'] === 'PROVIDER' ? 'PROVIDER' : 'CLIENT'; }

  get sectionLabel(): string { return this.role === 'CLIENT' ? 'Clientes' : 'Proveedores'; }
  get singularLabel(): string { return this.role === 'CLIENT' ? 'cliente' : 'proveedor'; }

  get page(): number { return this.pagination.page; }
  get pageSize(): number { return this.pagination.pageSize; }
  get totalElements(): number { return this.pagination.totalElements; }
  get totalPages(): number { return this.pagination.totalPages; }
  get first(): boolean { return this.pagination.first; }
  get last(): boolean { return this.pagination.last; }

  ngOnInit(): void {
    this.agentSearchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isLoadingAgents = true;
        this.agentsLoadError = '';
        return this.searchByRole(term, { page: 0, size: this.pageSize, sort: AGENT_DEFAULT_SORT }).pipe(
          catchError(() => {
            this.isLoadingAgents = false;
            this.agentsLoadError = 'No se pudieron cargar los agentes.';
            this.cdr.detectChanges();
            return EMPTY;
          })
        );
      })
    ).subscribe(data => this.zone.run(() => {
      this.isLoadingAgents = false;
      this.agents = data.content;
      updatePaginationState(this.pagination, data);
      this.cdr.detectChanges();
    }));
    this.onSearchTermChange('');
    this.loadIdentificationTypes();
  }

  loadAgents(page = this.page): void {
    const requestId = ++this.agentsRequestId;
    this.isLoadingAgents = true;
    this.agentsLoadError = '';
    this.searchByRole(this.searchTerm, { page, size: this.pageSize, sort: AGENT_DEFAULT_SORT }).subscribe({
      next: data => {
        if (requestId !== this.agentsRequestId) return;
        this.zone.run(() => {
          this.agents = data.content;
          updatePaginationState(this.pagination, data);
          this.isLoadingAgents = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        if (requestId !== this.agentsRequestId) return;
        this.zone.run(() => {
          this.isLoadingAgents = false;
          this.agentsLoadError = 'No se pudieron cargar los agentes.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.pagination.page = 0;
    this.agentSearchTerms.next(term);
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.page) this.loadAgents(page);
  }

  changePageSize(size: string): void {
    this.pagination.pageSize = Number(size) || DEFAULT_PAGE_SIZE;
    this.loadAgents(0);
  }

  loadIdentificationTypes(): void {
    this.identificationTypeService.getAllIdentityTypes().subscribe({
      next: data => {
        this.zone.run(() => {
          this.identificationTypes = data;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.identificationTypeError = 'No se pudieron cargar los tipos de identificacion.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  openModal(template: TemplateRef<any>) {
    this.identificationTypeError = '';
    this.newIdentificationTypeName = '';
    this.editingIdentificationTypeId = null;
    this.editingIdentificationTypeName = '';
    this.modalRef = this.modalService.show(template);
  }

  openAgentModal(template: TemplateRef<any>): void {
    this.resetAgentForm();
    this.modalRef = this.modalService.show(template);
  }

  openEditAgentModal(template: TemplateRef<any>, agent: AgentResponse): void {
    const identificationTypeValue = Number(agent.identificationType);
    const identificationTypeIdFromValue = Number.isNaN(identificationTypeValue)
      ? undefined
      : identificationTypeValue;
    const identificationTypeId =
      agent.identificationTypeId ??
      identificationTypeIdFromValue ??
      (this.identificationTypes.find(type => type.name === agent.identificationType)?.id ?? 0);

    this.agentForm = {
      name: agent.name ?? '',
      email: agent.email ?? '',
      phoneNumber: agent.phoneNumber ?? '',
      address: agent.address ?? '',
      receivables: this.toFiniteNumber(agent.receivables),
      payables: this.toFiniteNumber(agent.payables),
      identificationTypeId,
      role: this.role,
      identificationNumber: agent.identificationNumber ?? ''
    };
    this.agentError = '';
    this.agentFormSubmitted = false;
    this.editingAgentId = agent.id;
    this.modalRef = this.modalService.show(template);
  }

  resetAgentForm(): void {
    this.agentForm = {
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      receivables: 0,
      payables: 0,
      identificationTypeId: 0,
      role: this.role,
      identificationNumber: ''
    };
    this.agentError = '';
    this.agentFormSubmitted = false;
    this.editingAgentId = null;
  }

  saveAgent(): void {
    if (this.isSavingAgent) {
      return;
    }

    this.agentFormSubmitted = true;

    const trimmedName = this.agentForm.name.trim();
    if (!trimmedName) {
      this.agentError = 'El nombre es obligatorio.';
      return;
    }

    if (!this.agentForm.identificationTypeId) {
      this.agentError = 'Selecciona un tipo de identificacion.';
      return;
    }

    const receivables = Number(this.agentForm.receivables);
    const payables = Number(this.agentForm.payables);
    if (!Number.isFinite(receivables) || !Number.isFinite(payables)) {
      this.agentError = 'Los saldos deben ser valores numéricos válidos.';
      return;
    }

    this.isSavingAgent = true;
    this.agentError = '';

    const request: AgentUpsertRequest = {
      ...this.agentForm,
      name: trimmedName,
      receivables,
      payables,
      role: this.role
    };

    const request$ = this.editingAgentId
      ? this.agentService.updateAgent(this.editingAgentId, request)
      : this.agentService.createAgent(request);

    request$.pipe(
      finalize(() => {
        this.isSavingAgent = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.loadAgents(this.page);
          this.resetAgentForm();
          this.modalRef?.hide();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.agentError = this.editingAgentId
            ? 'No se pudo actualizar el agente.'
            : 'No se pudo guardar el agente.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteAgent(agent: AgentResponse): void {
    if (this.isSavingAgent) {
      return;
    }

    const confirmed = confirm(`Eliminar "${agent.name}"?`);
    if (!confirmed) {
      return;
    }

    const pageAfterDelete = this.agents.length === 1 && this.page > 0 ? this.page - 1 : this.page;
    this.isSavingAgent = true;
    this.agentError = '';

    this.agentService.deleteAgent(agent.id).pipe(
      timeout(10000),
      finalize(() => {
        this.isSavingAgent = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.loadAgents(pageAfterDelete);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.agentError = 'No se pudo eliminar el agente.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  getAgentIdentificationType(agent: AgentResponse): string {
    if (agent.identificationType) {
      const numericId = Number(agent.identificationType);
      if (!Number.isNaN(numericId)) {
        return this.identificationTypes.find(type => type.id === numericId)?.name ?? agent.identificationType;
      }

      return agent.identificationType;
    }

    if (agent.identificationTypeId) {
      return this.identificationTypes.find(type => type.id === agent.identificationTypeId)?.name ?? '';
    }

    return '';
  }

  getAgentRoleLabel(role: AgentRole): string {
    return AGENT_ROLE_LABEL[role];
  }

  formatMoney(value: string): number {
    return this.toFiniteNumber(value);
  }

  private searchByRole(term: string, request: { page: number; size: number; sort: string[] }) {
    if (term.trim()) return this.role === 'CLIENT'
      ? this.agentService.searchClients(term, request)
      : this.agentService.searchProviders(term, request);
    return this.role === 'CLIENT'
      ? this.agentService.getClients(request)
      : this.agentService.getProviders(request);
  }

  private toFiniteNumber(value: string | number | null | undefined): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  }

  trackByAgentId(index: number, agent: AgentResponse): number {
    return agent.id;
  }

  trackByIdentificationTypeId(index: number, type: IdentificationTypeResponse): number {
    return type.id;
  }

  isAgentNameInvalid(): boolean {
    return this.agentFormSubmitted && !this.agentForm.name.trim();
  }

  isIdentificationTypeInvalid(): boolean {
    return this.agentFormSubmitted && !this.agentForm.identificationTypeId;
  }

  createIdentificationType(): void {
    const trimmedName = this.newIdentificationTypeName.trim();
    if (!trimmedName || this.isSavingIdentificationType) {
      return;
    }

    this.isSavingIdentificationType = true;
    this.identificationTypeError = '';

    const request: IdentificationTypeRequest = { name: trimmedName };
    this.identificationTypeService.createIdentificationType(request).pipe(
      finalize(() => {
        this.isSavingIdentificationType = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.loadIdentificationTypes();
          this.newIdentificationTypeName = '';
          this.modalRef?.hide();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.identificationTypeError = 'No se pudo guardar el tipo de identificacion.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  startEditIdentificationType(type: IdentificationTypeResponse): void {
    this.identificationTypeError = '';
    this.editingIdentificationTypeId = type.id;
    this.editingIdentificationTypeName = type.name;
  }

  cancelEditIdentificationType(): void {
    this.editingIdentificationTypeId = null;
    this.editingIdentificationTypeName = '';
  }

  updateIdentificationType(type: IdentificationTypeResponse): void {
    const trimmedName = this.editingIdentificationTypeName.trim();
    if (!trimmedName || this.isSavingIdentificationType) {
      return;
    }

    this.isSavingIdentificationType = true;
    this.identificationTypeError = '';

    const request: IdentificationTypeRequest = { name: trimmedName };
    this.identificationTypeService.updateIdentificationType(type.id, request).pipe(
      finalize(() => {
        this.isSavingIdentificationType = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          const index = this.identificationTypes.findIndex(item => item.id === type.id);
          if (index >= 0) {
            this.identificationTypes = replaceById(this.identificationTypes, { ...type, name: trimmedName });
          } else {
            this.loadIdentificationTypes();
          }
          this.cancelEditIdentificationType();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.identificationTypeError = 'No se pudo actualizar el tipo de identificacion.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteIdentificationType(type: IdentificationTypeResponse): void {
    if (this.isSavingIdentificationType) {
      return;
    }

    const confirmed = confirm(`Eliminar "${type.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingIdentificationType = true;
    this.identificationTypeError = '';
    this.identificationTypeService.deleteIdentificationType(type.id).pipe(
      finalize(() => {
        this.isSavingIdentificationType = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.identificationTypes = removeById(this.identificationTypes, type.id);
          if (this.editingIdentificationTypeId === type.id) {
            this.cancelEditIdentificationType();
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.identificationTypeError = 'No se pudo eliminar el tipo de identificacion.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}
