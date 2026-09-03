import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { AgentRequest, AgentResponse } from './agent';
import { CommonModule } from '@angular/common';
import { IdentificationTypeService } from './identification-type.service';
import { IdentificationTypeRequest, IdentificationTypeResponse } from './identification-type';
import { HttpClientModule } from '@angular/common/http';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { AgentService } from './agent.service';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css'],
  providers: [IdentificationTypeService]
})
export class AgentsComponent implements OnInit {
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
  agentForm: AgentRequest = {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    balance: '',
    identificationTypeId: 0,
    identificationNumber: ''
  };
  agentFormSubmitted = false;
  editingAgentId: number | null = null;

  constructor(
    private identificationTypeService: IdentificationTypeService,
    private agentService: AgentService,
    private modalService: BsModalService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    this.loadAgents();
    this.loadIdentificationTypes();
  }

  loadAgents(): void {
    this.agentService.getAllAgents().subscribe({
      next: data => {
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        this.zone.run(() => {
          this.agents = list;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.agentError = 'No se pudieron cargar los agentes.';
          this.cdr.detectChanges();
        });
      }
    });
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
      balance: agent.balance?.toString() ?? '',
      identificationTypeId,
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
      balance: '',
      identificationTypeId: 0,
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

    this.isSavingAgent = true;
    this.agentError = '';

    const request: AgentRequest = {
      ...this.agentForm,
      name: trimmedName,
      balance: this.agentForm.balance?.toString() ?? ''
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
          this.loadAgents();
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
          this.loadAgents();
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
            this.identificationTypes[index] = { ...this.identificationTypes[index], name: trimmedName };
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
          this.identificationTypes = this.identificationTypes.filter(item => item.id !== type.id);
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
