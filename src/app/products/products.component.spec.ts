import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BsModalService } from 'ngx-bootstrap/modal';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AgentService } from '../agents/agent.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ProductsComponent } from './products.component';

const page = <T>(content: T[], number = 0, last = true) => ({ content, number, last, totalElements: content.length, totalPages: 1, size: 10, numberOfElements: content.length, first: number === 0, empty: !content.length });
const agent = { id: 7, name: 'Distribuidor', email: '', phoneNumber: '', address: '', balance: 0, identificationType: '', identificationNumber: '' };

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let products: { getProductsByAgentId: ReturnType<typeof vi.fn>; searchProducts: ReturnType<typeof vi.fn>; createProduct: ReturnType<typeof vi.fn>; updateProduct: ReturnType<typeof vi.fn>; deleteProduct: ReturnType<typeof vi.fn> };
  let agents: { getAllAgents: ReturnType<typeof vi.fn>; getAgentsWithProducts: ReturnType<typeof vi.fn>; searchAgents: ReturnType<typeof vi.fn> };
  let categories: { getAllCategories: ReturnType<typeof vi.fn>; createCategory: ReturnType<typeof vi.fn>; updateCategory: ReturnType<typeof vi.fn>; deleteCategory: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    products = { getProductsByAgentId: vi.fn(() => of(page([]))), searchProducts: vi.fn(() => of(page([]))), createProduct: vi.fn(() => of(void 0)), updateProduct: vi.fn(() => of(void 0)), deleteProduct: vi.fn(() => of(void 0)) };
    agents = { getAllAgents: vi.fn(() => of(page([]))), getAgentsWithProducts: vi.fn(() => of(page([]))), searchAgents: vi.fn(() => of(page([]))) };
    categories = { getAllCategories: vi.fn(() => of([])), createCategory: vi.fn(() => of(void 0)), updateCategory: vi.fn(() => of(void 0)), deleteCategory: vi.fn(() => of(void 0)) };
    await TestBed.configureTestingModule({ imports: [ProductsComponent], providers: [
      { provide: ProductService, useValue: products }, { provide: AgentService, useValue: agents }, { provide: CategoryService, useValue: categories },
      { provide: BsModalService, useValue: { show: vi.fn(() => ({ hide: vi.fn() })) } },
      { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } }
    ] }).compileComponents();
    component = TestBed.createComponent(ProductsComponent).componentInstance;
  });

  it('requires a product name and an agent before persisting', () => {
    component.saveProduct();
    expect(component.productError).toBe('El nombre es obligatorio.');
    component.productForm.name = 'Crema';
    component.saveProduct();
    expect(component.productError).toBe('Selecciona un agente.');
    expect(products.createProduct).not.toHaveBeenCalled();
  });

  it('trims product names and reloads the owner inventory after creation', () => {
    component.productForm = { name: '  Queso costeño ', quantity: 2, price: 8, cost: 4, unitType: 'kg', categoryId: 3, agendId: 7 };
    component.saveProduct();

    expect(products.createProduct).toHaveBeenCalledWith(expect.objectContaining({ name: 'Queso costeño', agendId: 7 }));
    expect(component.selectedAgentId).toBe(7);
    expect(products.getProductsByAgentId).toHaveBeenCalledWith(7, expect.objectContaining({ page: 0 }));
  });

  it('ignores an old inventory response after selecting another agent', () => {
    const first = new Subject<ReturnType<typeof page>>();
    const second = new Subject<ReturnType<typeof page>>();
    products.getProductsByAgentId.mockImplementation((id: number) => id === 7 ? first : second);
    component.selectAgent(agent);
    component.selectAgent({ ...agent, id: 8 });
    first.next(page([{ id: 1 }]));
    expect(component.products).toEqual([]);
    second.next(page([{ id: 2 }]));
    expect(component.products).toEqual([{ id: 2 }]);
  });

  it('loads every page when preparing agents for the product form', () => {
    agents.getAllAgents.mockImplementation(({ page: requestedPage }: { page: number }) => of(requestedPage === 0 ? page([agent], 0, false) : page([{ ...agent, id: 8 }], 1, true)));
    component.loadAgents();

    expect(component.agents.map(item => item.id)).toEqual([7, 8]);
    expect(agents.getAllAgents).toHaveBeenCalledTimes(2);
  });

  it('retains a clear server error when loading products fails', () => {
    products.getProductsByAgentId.mockReturnValue(throwError(() => new Error('offline')));
    component.selectAgent(agent);
    expect(component.productError).toBe('No se pudieron cargar los productos.');
  });
});
