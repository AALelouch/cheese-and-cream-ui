import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AgentResponse } from '../agents/agent';
import { AgentService } from '../agents/agent.service';
import { ProductResponse } from '../products/product';
import { ProductService } from '../products/product.service';
import { FinancialOperationRequest, FinancialOperationResponse } from './financial-operation';
import { FinancialOperationService } from './financial-operation.service';

interface OperationItem {
  productId: number;
  quantity: number;
}

interface OperationForm {
  amount: number;
  concept: string;
  operationType: 'SALE' | 'PURCHASE' | 'PAGO';
}

@Component({
  selector: 'app-financial-operations',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './financial-operations.component.html',
  styleUrls: ['./financial-operations.component.css']
})
export class FinancialOperationsComponent implements OnInit {
  agents: AgentResponse[] = [];
  productsByAgent: Record<number, ProductResponse[]> = {};
  operations: FinancialOperationResponse[] = [];
  selectedOperation: FinancialOperationResponse | null = null;
  selectedAgentId: number | null = null;
  operationAgentId: number | null = null;
  modalRef?: BsModalRef;
  isSavingOperation = false;
  operationError = '';
  operationFormSubmitted = false;
  operationMode: 'amount' | 'products' = 'amount';
  operationForm: OperationForm = {
    amount: 0,
    concept: '',
    operationType: 'SALE'
  };
  selectedProductId = 0;
  selectedProductQuantity = 1;
  items: OperationItem[] = [];

  constructor(
    private agentService: AgentService,
    private productService: ProductService,
    private financialOperationService: FinancialOperationService,
    private modalService: BsModalService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.agentService.getAllAgents().subscribe({
      next: data => {
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        this.zone.run(() => {
          this.agents = list;
          this.loadProductsForAgents(list);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.operationError = 'No se pudieron cargar los agentes.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadProductsForAgents(agents: AgentResponse[]): void {
    if (!agents.length) {
      this.productsByAgent = {};
      return;
    }

    const requests = agents.map(agent =>
      this.productService.getProductsByAgentId(agent.id).pipe(
        catchError(() => of([] as ProductResponse[]))
      )
    );

    forkJoin(requests).subscribe({
      next: responses => {
        const productsMap: Record<number, ProductResponse[]> = {};
        responses.forEach((response, index) => {
          const agent = agents[index];
          const list = Array.isArray(response) ? response : (response?.content ?? []);
          productsMap[agent.id] = list;
        });

        this.zone.run(() => {
          this.productsByAgent = productsMap;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.operationError = 'No se pudieron cargar los productos por agente.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadProductsByAgent(agentId: number): void {
    this.productService.getProductsByAgentId(agentId).subscribe({
      next: data => {
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        this.zone.run(() => {
          this.productsByAgent = {
            ...this.productsByAgent,
            [agentId]: list
          };
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.operationError = 'No se pudieron cargar los productos.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  refreshProductsForOperation(): void {
    if (!this.modalRef) {
      return;
    }

    if (this.operationMode !== 'products') {
      return;
    }

    if (this.operationForm.operationType === 'PURCHASE') {
      if (!this.selectedAgentId) {
        this.productsByAgent = {};
        this.cdr.detectChanges();
        return;
      }

      this.operationAgentId = this.selectedAgentId;

      this.loadProductsByAgent(this.selectedAgentId);
      return;
    }

    if (this.operationForm.operationType === 'SALE') {
      if (!this.operationAgentId) {
        this.productsByAgent = {};
        this.cdr.detectChanges();
        return;
      }

      this.loadProductsByAgent(this.operationAgentId);
      return;
    }

    if (!this.selectedAgentId) {
      this.productsByAgent = {};
      this.cdr.detectChanges();
      return;
    }

    this.loadProductsByAgent(this.selectedAgentId);
  }

  selectAgent(agent: AgentResponse): void {
    this.selectedAgentId = agent.id;
    this.loadOperations(agent.id);
  }

  loadOperations(agentId: number): void {
    this.financialOperationService.getByAgentId(agentId).subscribe({
      next: data => {
        this.zone.run(() => {
          this.operations = data;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.operationError = 'No se pudieron cargar las operaciones.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  openOperationDetail(template: TemplateRef<any>, operation: FinancialOperationResponse): void {
    this.selectedOperation = operation;
    this.modalRef = this.modalService.show(template, {
      class: 'modal-lg modal-dialog-centered financial-operation-modal'
    });
  }

  closeModal(): void {
    this.modalRef?.hide();
    this.selectedOperation = null;
  }

  openOperationModal(template: TemplateRef<any>): void {
    if (!this.selectedAgentId) {
      this.operationError = 'Selecciona un agente primero.';
      return;
    }

    this.resetOperationForm();
    this.operationAgentId = this.selectedAgentId;
    this.modalRef = this.modalService.show(template, {
      class: 'modal-xl modal-dialog-centered financial-operation-modal'
    });
    this.refreshProductsForOperation();
  }

  resetOperationForm(): void {
    this.operationForm = {
      amount: 0,
      concept: '',
      operationType: 'SALE'
    };
    this.operationMode = 'amount';
    this.operationAgentId = this.selectedAgentId;
    this.selectedProductId = 0;
    this.selectedProductQuantity = 1;
    this.items = [];
    this.operationError = '';
    this.operationFormSubmitted = false;
  }

  addItem(): void {
    if (!this.selectedProductId || this.selectedProductQuantity <= 0) {
      return;
    }

    const existing = this.items.find(item => item.productId === this.selectedProductId);
    if (existing) {
      existing.quantity += this.selectedProductQuantity;
    } else {
      this.items.push({ productId: this.selectedProductId, quantity: this.selectedProductQuantity });
    }

    this.selectedProductId = 0;
    this.selectedProductQuantity = 1;
  }

  removeItem(item: OperationItem): void {
    this.items = this.items.filter(entry => entry.productId !== item.productId);
  }

  saveOperation(): void {
    if (this.isSavingOperation || !this.selectedAgentId) {
      return;
    }

    this.operationFormSubmitted = true;
    if (!this.operationForm.concept.trim()) {
      this.operationError = 'El concepto es obligatorio.';
      return;
    }

    if (this.operationMode === 'amount') {
      if (!this.operationForm.amount || this.operationForm.amount <= 0) {
        this.operationError = 'Ingresa un monto mayor a cero.';
        return;
      }
      this.items = [];
    }

    if (this.operationMode === 'products') {
      if (this.operationForm.operationType === 'PAGO') {
        this.operationForm.operationType = 'SALE';
      }
      if (!this.items.length) {
        this.operationError = 'Agrega al menos un producto.';
        return;
      }
      this.operationForm.amount = 0;
    }

    this.isSavingOperation = true;
    this.operationError = '';

    const productsMap: Record<number, number> = {};
    this.items.forEach(item => {
      productsMap[item.productId] = item.quantity;
    });

    const requestAgentId = this.selectedAgentId;

    if (!requestAgentId) {
      this.operationError = 'Selecciona un agente primero.';
      return;
    }

    const request: FinancialOperationRequest = {
      idAgent: requestAgentId,
      amount: this.operationForm.amount,
      concept: this.operationForm.concept.trim(),
      operationType: this.operationForm.operationType === 'PAGO' ? 'PAYMENT' : this.operationForm.operationType,
      products: productsMap
    };

    this.financialOperationService.createOperation(request).pipe(
      finalize(() => {
        this.isSavingOperation = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.selectedAgentId = requestAgentId;
          this.loadOperations(requestAgentId);
          this.modalRef?.hide();
          this.resetOperationForm();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.operationError = 'No se pudo crear la operacion.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  isConceptInvalid(): boolean {
    return this.operationFormSubmitted && !this.operationForm.concept.trim();
  }

  isAmountInvalid(): boolean {
    return this.operationFormSubmitted && (this.operationForm.amount <= 0);
  }

  isAgentSelected(agentId: number): boolean {
    return this.selectedAgentId === agentId;
  }

  getProductName(productId: number): string {
    return this.getCurrentProductOptions().find(product => product.id === productId)?.name ?? '';
  }

  getCurrentProductOptions(): ProductResponse[] {
    if (this.operationMode !== 'products') {
      return [];
    }

    if (this.operationForm.operationType === 'SALE') {
      return this.operationAgentId ? (this.productsByAgent[this.operationAgentId] ?? []) : [];
    }

    return this.selectedAgentId ? (this.productsByAgent[this.selectedAgentId] ?? []) : [];
  }

  onOperationTypeChange(): void {
    if (this.operationForm.operationType === 'SALE' && !this.operationAgentId) {
      this.operationAgentId = this.selectedAgentId;
    }

    if (this.operationForm.operationType === 'PURCHASE') {
      this.operationAgentId = this.selectedAgentId;
    }

    this.selectedProductId = 0;
    this.items = [];
    this.refreshProductsForOperation();
  }

  onOperationAgentChange(): void {
    if (this.operationForm.operationType !== 'SALE' || !this.operationAgentId) {
      this.selectedProductId = 0;
      this.items = [];
      this.cdr.detectChanges();
      return;
    }

    if (!this.productsByAgent[this.operationAgentId]) {
      this.loadProductsByAgent(this.operationAgentId);
    }

    this.selectedProductId = 0;
    this.items = [];
    this.refreshProductsForOperation();
    this.cdr.detectChanges();
  }

  trackByAgentId(index: number, agent: AgentResponse): number {
    return agent.id;
  }

  trackByOperationId(index: number, operation: FinancialOperationResponse): number {
    return operation.id;
  }

  trackByProductId(index: number, product: ProductResponse): number {
    return product.id;
  }

  trackByItemProductId(index: number, item: OperationItem): number {
    return item.productId;
  }

  trackByOperationProductId(index: number, product: FinancialOperationResponse['productResponses'][number]): number {
    return product.id;
  }
}
