import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AgentResponse } from '../agents/agent';
import { AgentService } from '../agents/agent.service';
import { ProductResponse } from '../products/product';
import { ProductService } from '../products/product.service';
import { FinancialOperationRequest, FinancialOperationResponse, OPERATION_TYPE_LABELS, OperationType } from './financial-operation';
import { FinancialOperationService, FINANCIAL_OPERATION_DEFAULT_SORT } from './financial-operation.service';
import { createPaginationState, DEFAULT_PAGE_SIZE, updatePaginationState } from '../shared/pagination';

interface OperationItem {
  productId: number;
  quantity: number;
}

interface OperationForm {
  amount: number;
  concept: string;
  operationType: OperationType;
}

@Component({
  selector: 'app-financial-operations',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  productsLoadErrorAgentId: number | null = null;
  pagination = createPaginationState();
  readonly operationTypeLabels = OPERATION_TYPE_LABELS;
  private operationsRequestId = 0;
  private readonly productsRequestIds = new Map<number, number>();
  private readonly productsLoading = new Set<number>();

  get page(): number { return this.pagination.page; }
  get pageSize(): number { return this.pagination.pageSize; }
  get totalElements(): number { return this.pagination.totalElements; }
  get totalPages(): number { return this.pagination.totalPages; }
  get first(): boolean { return this.pagination.first; }
  get last(): boolean { return this.pagination.last; }

  getOperationLabel(type: OperationType): string { return this.operationTypeLabels[type]; }

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
        this.zone.run(() => {
          this.agents = data.content;
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

  loadProductsByAgent(agentId: number): void {
    if (!this.agentExists(agentId) || Object.prototype.hasOwnProperty.call(this.productsByAgent, agentId) || this.productsLoading.has(agentId)) return;

    const requestId = (this.productsRequestIds.get(agentId) ?? 0) + 1;
    this.productsRequestIds.set(agentId, requestId);
    this.productsLoading.add(agentId);
    if (this.productsLoadErrorAgentId === agentId) this.productsLoadErrorAgentId = null;
    this.productService.getProductsByAgentId(agentId).subscribe({
      next: data => {
        if (this.productsRequestIds.get(agentId) !== requestId) return;
        this.zone.run(() => {
          this.productsLoading.delete(agentId);
          if (this.productsLoadErrorAgentId === agentId) this.productsLoadErrorAgentId = null;
          this.productsByAgent = {
            ...this.productsByAgent,
            [agentId]: Array.isArray(data) ? data : (data?.content ?? [])
          };
          this.cdr.detectChanges();
        });
      },
      error: () => {
        if (this.productsRequestIds.get(agentId) !== requestId) return;
        this.zone.run(() => {
          this.productsLoading.delete(agentId);
          this.productsLoadErrorAgentId = agentId;
          this.cdr.detectChanges();
        });
      }
    });
  }

  refreshProductsForOperation(): void {
    const inventoryAgentId = this.getInventoryAgentId();
    if (this.modalRef && inventoryAgentId && this.isInventoryAgentValid()) this.loadProductsByAgent(inventoryAgentId);
  }

  retryProductsLoad(): void {
    const inventoryAgentId = this.getInventoryAgentId();
    if (inventoryAgentId && this.isInventoryAgentValid()) this.loadProductsByAgent(inventoryAgentId);
  }

  selectAgent(agent: AgentResponse): void {
    this.selectedAgentId = agent.id;
    this.loadOperations(agent.id, 0);
  }

  loadOperations(agentId: number, page = this.page): void {
    const requestId = ++this.operationsRequestId;
    this.financialOperationService.getByAgentId(agentId, { page, size: this.pageSize, sort: FINANCIAL_OPERATION_DEFAULT_SORT }).subscribe({
      next: data => {
        if (requestId !== this.operationsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.operations = data.content;
          updatePaginationState(this.pagination, data);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        if (requestId !== this.operationsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.operationError = 'No se pudieron cargar las operaciones.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  changePage(page: number): void {
    if (this.selectedAgentId && page >= 0 && page < this.totalPages && page !== this.page) this.loadOperations(this.selectedAgentId, page);
  }

  changePageSize(size: string): void {
    this.pagination.pageSize = Number(size) || DEFAULT_PAGE_SIZE;
    if (this.selectedAgentId) this.loadOperations(this.selectedAgentId, 0);
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
    this.operationAgentId = null;
    this.selectedProductId = 0;
    this.selectedProductQuantity = 1;
    this.items = [];
    this.operationError = '';
    this.operationFormSubmitted = false;
  }

  addItem(): void {
    if (!this.canAddItem()) {
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
      if (!Number.isFinite(Number(this.operationForm.amount)) || this.operationForm.amount <= 0) {
        this.operationError = 'Ingresa un monto mayor a cero.';
        return;
      }
      this.items = [];
    }

    if (this.operationMode === 'products') {
      if (!this.isProductOperationType()) {
        this.operationError = 'Selecciona una venta o compra para registrar productos.';
        return;
      }
      if (!this.isInventoryAgentValid()) {
        this.operationError = this.operationForm.operationType === 'SALE'
          ? 'Selecciona un agente de productos válido y diferente al agente principal.'
          : 'Selecciona un agente principal válido.';
        return;
      }
      if (!this.items.length) {
        this.operationError = 'Agrega al menos un producto.';
        return;
      }
      if (!this.items.every(item => this.isCurrentProduct(item.productId) && this.isValidQuantity(item.quantity))) {
        this.operationError = 'Los productos y cantidades deben pertenecer al agente de productos seleccionado.';
        return;
      }
      this.operationForm.amount = 0;
    }

    const requestAgentId = this.selectedAgentId;
    const inventoryAgentId = this.getInventoryAgentId();
    if (!requestAgentId) return;

    this.isSavingOperation = true;
    this.operationError = '';

    const productsMap: Record<number, number> = {};
    this.items.forEach(item => { productsMap[item.productId] = item.quantity; });

    const request: FinancialOperationRequest = {
      idAgent: requestAgentId,
      amount: this.operationForm.amount,
      concept: this.operationForm.concept.trim(),
      operationType: this.operationForm.operationType,
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
          if (inventoryAgentId) this.invalidateProducts(inventoryAgentId);
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
    return this.operationFormSubmitted && (!Number.isFinite(Number(this.operationForm.amount)) || this.operationForm.amount <= 0);
  }

  isOperationAgentInvalid(): boolean {
    return this.operationFormSubmitted && this.operationMode === 'products' && this.operationForm.operationType === 'SALE' && !this.isInventoryAgentValid();
  }

  isCurrentInventoryLoading(): boolean {
    const inventoryAgentId = this.getInventoryAgentId();
    return inventoryAgentId !== null && this.productsLoading.has(inventoryAgentId);
  }

  hasCurrentInventoryLoadError(): boolean {
    return this.productsLoadErrorAgentId === this.getInventoryAgentId();
  }

  canAddItem(): boolean {
    return this.operationMode === 'products'
      && this.isInventoryAgentValid()
      && !this.isCurrentInventoryLoading()
      && !this.hasCurrentInventoryLoadError()
      && this.isCurrentProduct(this.selectedProductId)
      && this.isValidQuantity(this.selectedProductQuantity);
  }

  isAgentSelected(agentId: number): boolean {
    return this.selectedAgentId === agentId;
  }

  getProductName(productId: number): string {
    return this.getCurrentProductOptions().find(product => product.id === productId)?.name ?? '';
  }

  getCurrentProductOptions(): ProductResponse[] {
    const inventoryAgentId = this.getInventoryAgentId();
    return inventoryAgentId ? (this.productsByAgent[inventoryAgentId] ?? []) : [];
  }

  onOperationTypeChange(): void {
    this.operationAgentId = null;
    this.resetProductSelection();
    this.refreshProductsForOperation();
  }

  onOperationModeChange(mode: 'amount' | 'products'): void {
    this.operationMode = mode;
    if (mode === 'products' && !this.isProductOperationType()) this.operationForm.operationType = 'SALE';
    this.operationAgentId = null;
    this.resetProductSelection();
    this.refreshProductsForOperation();
  }

  onOperationAgentChange(): void {
    this.resetProductSelection();
    this.refreshProductsForOperation();
    this.cdr.detectChanges();
  }

  private getInventoryAgentId(): number | null {
    if (this.operationMode !== 'products') return null;

    if (this.operationForm.operationType === 'PURCHASE') return this.selectedAgentId;

    return this.operationForm.operationType === 'SALE' ? this.operationAgentId : null;
  }

  private invalidateProducts(agentId: number): void {
    const { [agentId]: _, ...remainingProducts } = this.productsByAgent;
    this.productsByAgent = remainingProducts;
    this.productsRequestIds.set(agentId, (this.productsRequestIds.get(agentId) ?? 0) + 1);
    this.productsLoading.delete(agentId);
    if (this.productsLoadErrorAgentId === agentId) this.productsLoadErrorAgentId = null;
  }

  private resetProductSelection(): void {
    this.selectedProductId = 0;
    this.selectedProductQuantity = 1;
    this.items = [];
  }

  private isProductOperationType(): boolean {
    return this.operationForm.operationType === 'SALE' || this.operationForm.operationType === 'PURCHASE';
  }

  isInventoryAgentValid(): boolean {
    const inventoryAgentId = this.getInventoryAgentId();
    if (!inventoryAgentId || !this.agentExists(inventoryAgentId)) return false;
    return this.operationForm.operationType !== 'SALE' || inventoryAgentId !== this.selectedAgentId;
  }

  private agentExists(agentId: number): boolean {
    return this.agents.some(agent => agent.id === agentId);
  }

  private isCurrentProduct(productId: number): boolean {
    return Number.isInteger(productId) && this.getCurrentProductOptions().some(product => product.id === productId);
  }

  private isValidQuantity(quantity: number): boolean {
    return Number.isFinite(Number(quantity)) && Number.isInteger(Number(quantity)) && Number(quantity) > 0;
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
