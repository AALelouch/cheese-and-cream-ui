import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateRef } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AgentResponse } from '../agents/agent';
import { AgentService } from '../agents/agent.service';
import { ProductResponse } from '../products/product';
import { ProductService } from '../products/product.service';
import { FinancialOperationService } from './financial-operation.service';
import { FinancialOperationsComponent } from './financial-operations.component';

const agents: AgentResponse[] = [
  { id: 1, name: 'Principal', email: '', phoneNumber: '', address: '', balance: 0, identificationType: '', identificationNumber: '' },
  { id: 2, name: 'Inventario', email: '', phoneNumber: '', address: '', balance: 0, identificationType: '', identificationNumber: '' },
  { id: 3, name: 'Otro inventario', email: '', phoneNumber: '', address: '', balance: 0, identificationType: '', identificationNumber: '' }
];
const product = (id: number, name = `Producto ${id}`): ProductResponse => ({ id, name, quantity: 3, price: 10, cost: 5, unitType: 'Unidad', categoryName: 'Queso', agentName: '' });
const operationItem = (productId: number, quantity: number, agentId = 2, productName = `Producto ${productId}`) => ({ productId, quantity, agentId, productName });
const page = <T>(content: T[]) => ({ content, totalElements: content.length, totalPages: 1, size: 10, number: 0, numberOfElements: content.length, first: true, last: true, empty: !content.length });

describe('FinancialOperationsComponent', () => {
  let component: FinancialOperationsComponent;
  let fixture: ComponentFixture<FinancialOperationsComponent>;
  let agentService: { getAllAgents: ReturnType<typeof vi.fn> };
  let productService: { getProductsByAgentId: ReturnType<typeof vi.fn> };
  let financialOperationService: { getByAgentId: ReturnType<typeof vi.fn>; createOperation: ReturnType<typeof vi.fn> };
  let modalService: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    agentService = { getAllAgents: vi.fn(() => of(page(agents))) };
    productService = { getProductsByAgentId: vi.fn(() => of(page([]))) };
    financialOperationService = { getByAgentId: vi.fn(() => of(page([]))), createOperation: vi.fn(() => of(void 0)) };
    modalService = { show: vi.fn(() => ({ hide: vi.fn() })) };

    await TestBed.configureTestingModule({
      imports: [FinancialOperationsComponent],
      providers: [
        { provide: AgentService, useValue: agentService },
        { provide: ProductService, useValue: productService },
        { provide: FinancialOperationService, useValue: financialOperationService },
        { provide: BsModalService, useValue: modalService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(FinancialOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function openForProducts(): void {
    component.selectedAgentId = 1;
    component.openOperationModal({} as TemplateRef<unknown>);
    component.onOperationModeChange('products');
  }

  it('loads agents on demand and reports an agents error', async () => {
    component.loadAgents();
    expect(component.agents).toEqual(agents);

    agentService.getAllAgents.mockReturnValue(throwError(() => new Error('offline')));
    const anotherFixture = TestBed.createComponent(FinancialOperationsComponent);
    anotherFixture.componentInstance.loadAgents();
    expect(anotherFixture.componentInstance.operationError).toContain('agentes');
  });

  it('requires an explicit, different inventory agent for SALE and loads only its products', () => {
    openForProducts();
    expect(component.operationAgentId).toBeNull();
    expect(productService.getProductsByAgentId).not.toHaveBeenCalled();

    component.operationAgentId = 2;
    component.onOperationAgentChange();
    expect(productService.getProductsByAgentId).toHaveBeenCalledWith(2);

    component.operationAgentId = 1;
    component.onOperationAgentChange();
    expect(component.canAddItem()).toBe(false);
    component.operationForm.concept = 'Venta';
    component.items = [operationItem(2, 1)];
    component.saveOperation();
    expect(component.operationError).toContain('diferente');
  });

  it('uses the main agent inventory for PURCHASE and never sends operationAgentId as idAgent', () => {
    openForProducts();
    component.operationForm.operationType = 'PURCHASE';
    component.onOperationTypeChange();
    expect(component.operationAgentId).toBeNull();
    expect(productService.getProductsByAgentId).toHaveBeenCalledWith(1);

    component.productsByAgent = { 1: [product(10)] };
    component.items = [operationItem(10, 2, 1)];
    component.operationForm.concept = 'Compra';
    component.saveOperation();
    expect(financialOperationService.createOperation).toHaveBeenCalledWith(expect.objectContaining({
      idAgent: 1,
      operationType: 'PURCHASE',
      amount: 0,
      products: { 10: 2 }
    }));
  });

  it('keeps the main agent as idAgent when SALE products come from another agent', () => {
    openForProducts();
    component.operationAgentId = 2;
    component.productsByAgent = { 2: [product(20)] };
    component.items = [operationItem(20, 2)];
    component.operationForm.concept = 'Venta a principal';

    component.saveOperation();

    expect(financialOperationService.createOperation).toHaveBeenCalledWith(expect.objectContaining({
      idAgent: 1,
      operationType: 'SALE',
      amount: 0,
      products: { 20: 2 }
    }));
  });

  it('resets the product input while retaining added items when changing inventory agent', () => {
    openForProducts();
    component.operationAgentId = 2;
    component.selectedProductId = 10;
    component.selectedProductQuantity = 4;
    component.items = [operationItem(10, 4)];
    component.onOperationAgentChange();
    expect(component.selectedProductId).toBe(0);
    expect(component.selectedProductQuantity).toBe(1);
    expect(component.items).toEqual([operationItem(10, 4)]);

    component.selectedProductQuantity = 3;
    component.items = [operationItem(10, 1)];
    component.onOperationModeChange('amount');
    expect(component.items).toEqual([]);
    expect(component.selectedProductQuantity).toBe(1);
  });

  it('rejects foreign products and invalid quantities, while duplicate additions are combined', () => {
    openForProducts();
    component.operationAgentId = 2;
    component.productsByAgent = { 2: [product(20)] };
    component.selectedProductId = 99;
    component.selectedProductQuantity = 1;
    component.addItem();
    expect(component.items).toEqual([]);

    component.selectedProductId = 20;
    component.selectedProductQuantity = 1.5;
    component.addItem();
    expect(component.items).toEqual([]);

    component.selectedProductQuantity = 2;
    component.addItem();
    component.selectedProductId = 20;
    component.selectedProductQuantity = 3;
    component.addItem();
    expect(component.items).toEqual([operationItem(20, 5)]);

    component.items = [operationItem(20, Number.NaN)];
    component.operationForm.concept = 'Venta';
    component.saveOperation();
    expect(component.operationError).toContain('cantidades de los productos');
  });

  it('caches successes, retries failures, and keeps delayed results out of the active selector', () => {
    const first = new Subject<ReturnType<typeof page<ProductResponse>>>();
    const second = new Subject<ReturnType<typeof page<ProductResponse>>>();
    const retry = new Subject<ReturnType<typeof page<ProductResponse>>>();
    let agent2Requests = 0;
    productService.getProductsByAgentId.mockImplementation((id: number) => id === 2
      ? (++agent2Requests === 1 ? first : retry)
      : second);
    openForProducts();
    component.operationAgentId = 2;
    component.onOperationAgentChange();
    component.refreshProductsForOperation();
    expect(productService.getProductsByAgentId).toHaveBeenCalledTimes(1);

    component.operationAgentId = 3;
    component.onOperationAgentChange();
    first.next(page([product(20)]));
    expect(component.getCurrentProductOptions()).toEqual([]);
    second.error(new Error('offline'));
    expect(component.hasCurrentInventoryLoadError()).toBe(true);
    component.retryProductsLoad();
    expect(productService.getProductsByAgentId).toHaveBeenCalledTimes(3);

    component.operationAgentId = 2;
    component.onOperationAgentChange();
    expect(component.getCurrentProductOptions()).toEqual([product(20)]);
  });

  it('blocks duplicate saves, invalidates only affected inventory cache after success, and retains server errors', () => {
    const create = new Subject<void>();
    financialOperationService.createOperation.mockReturnValue(create);
    openForProducts();
    component.operationAgentId = 2;
    component.productsByAgent = { 2: [product(20)], 3: [product(30)] };
    component.items = [operationItem(20, 1)];
    component.operationForm.concept = 'Venta';
    component.saveOperation();
    component.saveOperation();
    expect(financialOperationService.createOperation).toHaveBeenCalledTimes(1);
    create.next();
    create.complete();
    expect(component.productsByAgent[2]).toBeUndefined();
    expect(component.productsByAgent[3]).toEqual([product(30)]);

    financialOperationService.createOperation.mockReturnValue(throwError(() => new Error('server')));
    component.selectedAgentId = 1;
    component.operationForm.concept = 'Pago';
    component.operationForm.amount = 5;
    component.operationMode = 'amount';
    component.saveOperation();
    expect(component.operationError).toContain('No se pudo crear');
  });

  it('exposes the invariants used by the guarded template controls', () => {
    openForProducts();
    expect(component.isInventoryAgentValid()).toBe(false);
    expect(component.canAddItem()).toBe(false);
    component.operationAgentId = 2;
    component.productsByAgent = { 2: [product(20)] };
    component.selectedProductId = 20;
    expect(component.canAddItem()).toBe(true);
  });
});
