import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, Subject, switchMap } from 'rxjs';
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
  agentId: number;
  productName: string;
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
  agentSearchTerm = '';
  operationAgentSearchTerm = '';
  operationSearchTerm = '';
  productSearchTerm = '';
  isLoadingAgents = false;
  isLoadingOperations = false;
  agentLookupError = '';
  isLoadingOperationAgents = false;
  operationAgentLookupError = '';
  operationAgents: AgentResponse[] = [];
  operationAgentsSearchPage = 0;
  operationAgentsSearchLast = true;
  agentsSearchPage = 0;
  agentsSearchLast = true;
  productSearchPage = 0;
  productSearchLast = true;
  operationAgentId: number | null = null;
  modalRef?: BsModalRef;
  isSavingOperation = false;
  operationsLoadError = '';
  operationFormError = '';
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
  private readonly agentSearchTerms = new Subject<string>();
  private readonly operationSearchTerms = new Subject<string>();
  private readonly operationAgentSearchTerms = new Subject<string>();

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
    this.agentSearchTerms.pipe(debounceTime(300), distinctUntilChanged(), switchMap(term => {
      this.isLoadingAgents = true;
      this.agentLookupError = '';
      return this.agentService.searchAgents(term, { page: 0, size: 10 }).pipe(catchError(() => {
        this.isLoadingAgents = false;
        this.agentLookupError = 'No se pudieron buscar los agentes.';
        this.cdr.detectChanges();
        return EMPTY;
      }));
    })).subscribe(data => this.zone.run(() => {
      this.agents = data.content;
      this.agentsSearchPage = data.number + 1;
      this.agentsSearchLast = data.last;
      this.isLoadingAgents = false;
      this.cdr.detectChanges();
    }));
    this.operationSearchTerms.pipe(debounceTime(300), distinctUntilChanged(), switchMap(term => {
      if (!this.selectedAgentId) return EMPTY;
      const agentId = this.selectedAgentId;
      this.isLoadingOperations = true;
      this.operationsLoadError = '';
      const request$ = term
        ? this.financialOperationService.searchOperations(agentId, term, { page: 0, size: this.pageSize, sort: FINANCIAL_OPERATION_DEFAULT_SORT })
        : this.financialOperationService.getByAgentId(agentId, { page: 0, size: this.pageSize, sort: FINANCIAL_OPERATION_DEFAULT_SORT });
      return request$.pipe(catchError(() => {
        this.isLoadingOperations = false;
        this.operationsLoadError = 'No se pudieron cargar las operaciones.';
        this.cdr.detectChanges();
        return EMPTY;
      }));
    })).subscribe(data => this.zone.run(() => {
      this.operations = data.content;
      this.isLoadingOperations = false;
      updatePaginationState(this.pagination, data);
      this.cdr.detectChanges();
    }));
    this.operationAgentSearchTerms.pipe(debounceTime(300), distinctUntilChanged(), switchMap(term => {
      this.isLoadingOperationAgents = true;
      this.operationAgentLookupError = '';
      return this.getOperationAgentsRequest(term, { page: 0, size: 10 }).pipe(catchError(() => {
        this.isLoadingOperationAgents = false;
        this.operationAgentLookupError = 'No se pudieron buscar los agentes de productos.';
        this.cdr.detectChanges();
        return EMPTY;
      }));
    })).subscribe(data => this.zone.run(() => {
      this.operationAgents = data.content;
      this.operationAgentsSearchPage = data.number + 1;
      this.operationAgentsSearchLast = data.last;
      this.isLoadingOperationAgents = false;
      this.cdr.detectChanges();
    }));
    this.loadAgents();
  }

  onAgentSearchChange(term: string): void {
    this.agentSearchTerm = term;
    this.agentSearchTerms.next(term);
  }

  onOperationAgentSearchChange(term: string): void {
    this.operationAgentSearchTerm = term;
    this.operationAgents = [];
    this.operationAgentsSearchPage = 0;
    this.operationAgentsSearchLast = true;
    this.operationAgentSearchTerms.next(term);
  }

  private getOperationAgentsRequest(term: string, request: { page: number; size: number }) {
    return term
      ? this.agentService.searchAgentsWithProducts(term, request)
      : this.agentService.getAgentsWithProducts(request);
  }

  loadMoreOperationAgents(): void {
    if (this.isLoadingOperationAgents || this.operationAgentsSearchLast) return;
    this.isLoadingOperationAgents = true;
    this.getOperationAgentsRequest(this.operationAgentSearchTerm, { page: this.operationAgentsSearchPage, size: 10 }).subscribe({
      next: data => this.zone.run(() => {
        this.operationAgents = [...this.operationAgents, ...data.content];
        this.operationAgentsSearchPage = data.number + 1;
        this.operationAgentsSearchLast = data.last;
        this.isLoadingOperationAgents = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.isLoadingOperationAgents = false;
        this.operationAgentLookupError = 'No se pudieron cargar más agentes.';
        this.cdr.detectChanges();
      })
    });
  }

  loadMoreAgents(): void {
    if (this.isLoadingAgents || this.agentsSearchLast) return;
    this.isLoadingAgents = true;
    this.agentService.searchAgents(this.agentSearchTerm, { page: this.agentsSearchPage, size: 10 }).subscribe({
      next: data => this.zone.run(() => {
        this.agents = [...this.agents, ...data.content];
        this.agentsSearchPage = data.number + 1;
        this.agentsSearchLast = data.last;
        this.isLoadingAgents = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.isLoadingAgents = false;
        this.agentLookupError = 'No se pudieron cargar más agentes.';
        this.cdr.detectChanges();
      })
    });
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
          this.agentLookupError = 'No se pudieron cargar los agentes.';
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
          if (!Array.isArray(data)) {
            this.productSearchPage = data.number + 1;
            this.productSearchLast = data.last;
          }
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
    if (this.selectedAgentId === agent.id) return;
    this.selectedAgentId = agent.id;
    this.operationSearchTerm = '';
    this.productSearchTerm = '';
    this.operations = [];
    this.pagination = createPaginationState(this.pageSize);
    this.loadOperations(agent.id, 0);
  }

  loadOperations(agentId: number, page = this.page): void {
    const requestId = ++this.operationsRequestId;
    this.isLoadingOperations = true;
    const request$ = this.operationSearchTerm
      ? this.financialOperationService.searchOperations(agentId, this.operationSearchTerm, { page, size: this.pageSize, sort: FINANCIAL_OPERATION_DEFAULT_SORT })
      : this.financialOperationService.getByAgentId(agentId, { page, size: this.pageSize, sort: FINANCIAL_OPERATION_DEFAULT_SORT });
    request$.subscribe({
      next: data => {
        if (requestId !== this.operationsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.operations = data.content;
          updatePaginationState(this.pagination, data);
          this.isLoadingOperations = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        if (requestId !== this.operationsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.isLoadingOperations = false;
          this.operationsLoadError = 'No se pudieron cargar las operaciones.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  onOperationSearchChange(term: string): void {
    this.operationSearchTerm = term;
    this.pagination.page = 0;
    this.operationSearchTerms.next(term);
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
      this.agentLookupError = 'Selecciona un agente primero.';
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
    this.operationAgentSearchTerm = '';
    this.operationAgents = [];
    this.operationAgentsSearchPage = 0;
    this.operationAgentsSearchLast = true;
    this.operationAgentLookupError = '';
    this.selectedProductId = 0;
    this.selectedProductQuantity = 1;
    this.items = [];
    this.operationFormError = '';
    this.operationFormSubmitted = false;
  }

  addItem(): void {
    if (!this.canAddItem()) {
      return;
    }

    const inventoryAgentId = this.getInventoryAgentId();
    const product = this.getCurrentProductOptions().find(item => item.id === this.selectedProductId);
    if (!inventoryAgentId || !product) return;

    const existing = this.items.find(item => item.productId === this.selectedProductId);
    if (existing) {
      existing.quantity += this.selectedProductQuantity;
    } else {
      this.items.push({
        productId: this.selectedProductId,
        quantity: this.selectedProductQuantity,
        agentId: inventoryAgentId,
        productName: product.name
      });
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
      this.operationFormError = 'El concepto es obligatorio.';
      return;
    }

    if (this.operationMode === 'amount') {
      if (!Number.isFinite(Number(this.operationForm.amount)) || this.operationForm.amount <= 0) {
        this.operationFormError = 'Ingresa un monto mayor a cero.';
        return;
      }
      this.items = [];
    }

    if (this.operationMode === 'products') {
      if (!this.isProductOperationType()) {
        this.operationFormError = 'Selecciona una venta o compra para registrar productos.';
        return;
      }
      if (!this.isInventoryAgentValid()) {
        this.operationFormError = this.operationForm.operationType === 'SALE'
          ? 'Selecciona un agente de productos válido y diferente al agente principal.'
          : 'Selecciona un agente principal válido.';
        return;
      }
      if (!this.items.length) {
        this.operationFormError = 'Agrega al menos un producto.';
        return;
      }
      if (!this.items.every(item => Number.isInteger(item.productId) && this.isValidQuantity(item.quantity))) {
        this.operationFormError = 'Revisa las cantidades de los productos agregados.';
        return;
      }
      this.operationForm.amount = 0;
    }

    const requestAgentId = this.selectedAgentId;
    const inventoryAgentId = this.getInventoryAgentId();
    if (!requestAgentId) return;

    this.isSavingOperation = true;
    this.operationFormError = '';

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
          this.operationFormError = 'No se pudo crear la operacion.';
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
    if (this.operationForm.operationType === 'SALE') this.onOperationAgentSearchChange('');
  }

  onOperationModeChange(mode: 'amount' | 'products'): void {
    this.operationMode = mode;
    if (mode === 'products' && !this.isProductOperationType()) this.operationForm.operationType = 'SALE';
    this.operationAgentId = null;
    this.resetProductSelection();
    this.refreshProductsForOperation();
    if (mode === 'products') this.onOperationAgentSearchChange('');
  }

  onOperationAgentChange(): void {
    this.resetProductInput();
    this.refreshProductsForOperation();
    this.cdr.detectChanges();
  }

  onProductSearchChange(term: string): void {
    this.productSearchTerm = term;
    const inventoryAgentId = this.getInventoryAgentId();
    if (!inventoryAgentId || !this.isInventoryAgentValid()) return;
    this.selectedProductId = 0;
    this.items = [];
    this.productsLoading.add(inventoryAgentId);
    this.productService.searchProducts(inventoryAgentId, term, { page: 0, size: 10 }).subscribe({
      next: data => this.zone.run(() => {
        this.productsLoading.delete(inventoryAgentId);
        this.productsByAgent = { ...this.productsByAgent, [inventoryAgentId]: data.content };
        this.productSearchPage = data.number + 1;
        this.productSearchLast = data.last;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.productsLoading.delete(inventoryAgentId);
        this.productsLoadErrorAgentId = inventoryAgentId;
        this.cdr.detectChanges();
      })
    });
  }

  loadMoreProducts(): void {
    const inventoryAgentId = this.getInventoryAgentId();
    if (!inventoryAgentId || this.productsLoading.has(inventoryAgentId) || this.productSearchLast) return;
    this.productsLoading.add(inventoryAgentId);
    this.productService.searchProducts(inventoryAgentId, this.productSearchTerm, { page: this.productSearchPage, size: 10 }).subscribe({
      next: data => this.zone.run(() => {
        this.productsLoading.delete(inventoryAgentId);
        this.productsByAgent = { ...this.productsByAgent, [inventoryAgentId]: [...this.getCurrentProductOptions(), ...data.content] };
        this.productSearchPage = data.number + 1;
        this.productSearchLast = data.last;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.productsLoading.delete(inventoryAgentId);
        this.productsLoadErrorAgentId = inventoryAgentId;
        this.cdr.detectChanges();
      })
    });
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
    this.resetProductInput();
    this.items = [];
  }

  private resetProductInput(): void {
    this.selectedProductId = 0;
    this.productSearchTerm = '';
    this.selectedProductQuantity = 1;
    this.productSearchPage = 0;
    this.productSearchLast = true;
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
    return agentId === this.selectedAgentId || agentId === this.operationAgentId || this.agents.some(agent => agent.id === agentId) || this.operationAgents.some(agent => agent.id === agentId);
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
