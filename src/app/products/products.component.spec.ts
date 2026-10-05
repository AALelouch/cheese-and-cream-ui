import { ChangeDetectorRef, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BsModalService } from 'ngx-bootstrap/modal';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AgentService } from '../agents/agent.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ProductsComponent } from './products.component';

const page = <T>(content: T[], number = 0, last = true) => ({ content, number, last, totalElements: content.length, totalPages: 1, size: 10, numberOfElements: content.length, first: number === 0, empty: !content.length });
const agent = { id: 7, name: 'Distribuidor', email: '', phoneNumber: '', address: '', receivables: '0', payables: '0', balance: '0', role: 'PROVIDER' as const, identificationType: '', identificationNumber: '' };

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let products: { getProductsByAgentId: ReturnType<typeof vi.fn>; searchProducts: ReturnType<typeof vi.fn>; createProduct: ReturnType<typeof vi.fn>; updateProduct: ReturnType<typeof vi.fn>; deleteProduct: ReturnType<typeof vi.fn> };
  let agents: { searchProviderIdNames: ReturnType<typeof vi.fn> };
  let categories: { getAllCategories: ReturnType<typeof vi.fn>; createCategory: ReturnType<typeof vi.fn>; updateCategory: ReturnType<typeof vi.fn>; deleteCategory: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    products = { getProductsByAgentId: vi.fn(() => of(page([]))), searchProducts: vi.fn(() => of(page([]))), createProduct: vi.fn(() => of(void 0)), updateProduct: vi.fn(() => of(void 0)), deleteProduct: vi.fn(() => of(void 0)) };
    agents = { searchProviderIdNames: vi.fn(() => of(page([]))) };
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
    expect(component.productError).toBe('Selecciona un proveedor.');
    expect(products.createProduct).not.toHaveBeenCalled();
  });

  it('trims product names and reloads the owner inventory after creation', () => {
    component.productForm = { name: '  Queso costeño ', quantity: 2, cost: 4, unitType: 'kg', categoryId: 3, agendId: 7 };
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

  it('uses provider lookup when preparing the product form', () => {
    agents.searchProviderIdNames.mockReturnValue(of(page([agent])));
    component.loadAgents();

    expect(agents.searchProviderIdNames).toHaveBeenCalledWith('', { page: 0, size: 10 });
  });

  it('uses only the selected agent id when preparing a product for editing', () => {
    component.selectedAgentId = 7;
    component.categories = [{ id: 3, name: 'Quesos' }];

    component.openEditProductModal({} as TemplateRef<unknown>, {
      id: 11,
      name: 'Queso costeño',
      quantity: 2,
      cost: 4,
      unitType: 'kg',
      categoryName: 'Quesos'
    });

    expect(component.productForm.agendId).toBe(7);
    expect(component.productForm.categoryId).toBe(3);
  });

  it('does not infer an agent when no agent is selected for editing', () => {
    component.selectedAgentId = null;

    component.openEditProductModal({} as TemplateRef<unknown>, {
      id: 11,
      name: 'Queso costeño',
      quantity: 2,
      cost: 4,
      unitType: 'kg',
      categoryName: 'Quesos'
    });

    expect(component.productForm.agendId).toBe(0);
  });

  it('sends the selected agent id when updating a product', () => {
    component.selectedAgentId = 7;
    component.categories = [{ id: 3, name: 'Quesos' }];
    component.openEditProductModal({} as TemplateRef<unknown>, {
      id: 11,
      name: 'Queso costeño',
      quantity: 2,
      cost: 4,
      unitType: 'kg',
      categoryName: 'Quesos'
    });

    component.saveProduct();

    expect(products.updateProduct).toHaveBeenCalledWith(11, expect.objectContaining({ agendId: 7 }));
  });

  it('uses the lightweight server results without changing the selected value', () => {
    component.agents = [agent, { id: 8, name: 'María' }];
    component.productForm.agendId = 7;
    component.productFormAgentSearchTerm = 'maría';

    expect(component.filteredProductFormAgents.map(item => item.id)).toEqual([7, 8]);
    expect(component.productForm.agendId).toBe(7);
  });

  it('filters categories by their term and clears both form searches on reset', () => {
    component.categories = [{ id: 1, name: 'Quesos maduros' }, { id: 2, name: 'Cremas' }];
    component.productFormCategorySearchTerm = 'crem';
    component.productFormAgentSearchTerm = 'distrib';

    expect(component.filteredProductFormCategories).toEqual([{ id: 2, name: 'Cremas' }]);
    component.resetProductForm();
    expect(component.productFormCategorySearchTerm).toBe('');
    expect(component.productFormAgentSearchTerm).toBe('');
  });

  it('retains a clear server error when loading products fails', () => {
    products.getProductsByAgentId.mockReturnValue(throwError(() => new Error('offline')));
    component.selectAgent(agent);
    expect(component.productError).toBe('No se pudieron cargar los productos.');
  });
});
