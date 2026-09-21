import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, Subject, switchMap } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AgentResponse } from '../agents/agent';
import { AgentService } from '../agents/agent.service';
import { CategoryResponse } from './category';
import { CategoryService } from './category.service';
import { ProductRequest, ProductResponse } from './product';
import { ProductService, PRODUCT_DEFAULT_SORT } from './product.service';
import { createPaginationState, DEFAULT_PAGE_SIZE, updatePaginationState } from '../shared/pagination';
import { removeById, replaceById } from '../shared/collection';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  products: ProductResponse[] = [];
  agents: AgentResponse[] = [];
  agentsWithProducts: AgentResponse[] = [];
  categories: CategoryResponse[] = [];
  selectedAgentId: number | null = null;
  agentSearchTerm = '';
  productFormAgentSearchTerm = '';
  productFormCategorySearchTerm = '';
  productSearchTerm = '';
  isLoadingProducts = false;
  isLoadingAgentsWithProducts = false;
  agentsWithProductsError = '';
  modalRef?: BsModalRef;
  isSavingProduct = false;
  productError = '';
  editingProductId: number | null = null;
  isSavingCategory = false;
  categoryError = '';
  newCategoryName = '';
  editingCategoryId: number | null = null;
  editingCategoryName = '';
  productForm: ProductRequest = {
    name: '',
    quantity: 0,
    price: 0,
    cost: 0,
    unitType: '',
    categoryId: 0,
    agendId: 0
  };
  productFormSubmitted = false;
  pagination = createPaginationState();
  private productsRequestId = 0;
  private agentsWithProductsPage = 0;
  agentsWithProductsLast = true;
  private readonly productSearchTerms = new Subject<string>();
  private readonly agentSearchTerms = new Subject<string>();

  constructor(
    private productService: ProductService,
    private agentService: AgentService,
    private categoryService: CategoryService,
    private modalService: BsModalService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  get page(): number { return this.pagination.page; }
  get pageSize(): number { return this.pagination.pageSize; }
  get totalElements(): number { return this.pagination.totalElements; }
  get totalPages(): number { return this.pagination.totalPages; }
  get first(): boolean { return this.pagination.first; }
  get last(): boolean { return this.pagination.last; }
  get filteredProductFormAgents(): AgentResponse[] {
    const term = this.productFormAgentSearchTerm.trim().toLocaleLowerCase();
    if (!term) return this.agents;
    return this.agents.filter(agent => [agent.name, agent.email, agent.identificationNumber]
      .some(value => value?.toLocaleLowerCase().includes(term)));
  }
  get filteredProductFormCategories(): CategoryResponse[] {
    const term = this.productFormCategorySearchTerm.trim().toLocaleLowerCase();
    return term ? this.categories.filter(category => category.name.toLocaleLowerCase().includes(term)) : this.categories;
  }

  ngOnInit(): void {
    this.loadAgents();
    this.agentSearchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isLoadingAgentsWithProducts = true;
        this.agentsWithProductsError = '';
        const request$ = term
          ? this.agentService.searchAgents(term, { page: 0, size: 10 })
          : this.agentService.getAgentsWithProducts({ page: 0, size: 10 });
        return request$.pipe(catchError(() => {
          this.isLoadingAgentsWithProducts = false;
          this.agentsWithProductsError = 'No se pudieron cargar los agentes.';
          this.cdr.detectChanges();
          return EMPTY;
        }));
      })
    ).subscribe(data => this.zone.run(() => {
      this.agentsWithProducts = data.content;
      this.agentsWithProductsPage = data.number + 1;
      this.agentsWithProductsLast = data.last;
      this.isLoadingAgentsWithProducts = false;
      this.cdr.detectChanges();
    }));
    this.onAgentSearchChange('');
    this.loadCategories();
    this.productSearchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!this.selectedAgentId) return EMPTY;
        const agentId = this.selectedAgentId;
        this.isLoadingProducts = true;
        this.productError = '';
        const request$ = term
          ? this.productService.searchProducts(agentId, term, { page: 0, size: this.pageSize, sort: PRODUCT_DEFAULT_SORT })
          : this.productService.getProductsByAgentId(agentId, { page: 0, size: this.pageSize, sort: PRODUCT_DEFAULT_SORT });
        return request$.pipe(catchError(() => {
          this.isLoadingProducts = false;
          this.productError = 'No se pudieron cargar los productos.';
          this.cdr.detectChanges();
          return EMPTY;
        }));
      })
    ).subscribe(data => this.zone.run(() => {
      this.isLoadingProducts = false;
      this.products = data.content;
      updatePaginationState(this.pagination, data);
      this.cdr.detectChanges();
    }));
  }

  loadProductsByAgent(agentId: number, page = this.page): void {
    const requestId = ++this.productsRequestId;
    this.isLoadingProducts = true;
    const request$ = this.productSearchTerm
      ? this.productService.searchProducts(agentId, this.productSearchTerm, { page, size: this.pageSize, sort: PRODUCT_DEFAULT_SORT })
      : this.productService.getProductsByAgentId(agentId, { page, size: this.pageSize, sort: PRODUCT_DEFAULT_SORT });
    request$.subscribe({
      next: data => {
        if (requestId !== this.productsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.products = data.content;
          updatePaginationState(this.pagination, data);
          this.isLoadingProducts = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        if (requestId !== this.productsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.isLoadingProducts = false;
          this.productError = 'No se pudieron cargar los productos.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  selectAgent(agent: AgentResponse): void {
    if (this.selectedAgentId === agent.id) return;
    this.selectedAgentId = agent.id;
    this.productSearchTerm = '';
    this.products = [];
    this.pagination = createPaginationState(this.pageSize);
    this.loadProductsByAgent(agent.id, 0);
  }

  clearAgentFilter(): void {
    this.productsRequestId++;
    this.selectedAgentId = null;
    this.products = [];
    this.productSearchTerm = '';
    this.pagination = createPaginationState(this.pageSize);
    this.cdr.detectChanges();
  }

  onProductSearchChange(term: string): void {
    this.productSearchTerm = term;
    this.pagination.page = 0;
    this.productSearchTerms.next(term);
  }

  onAgentSearchChange(term: string): void {
    this.agentSearchTerm = term;
    this.agentsWithProducts = [];
    this.agentsWithProductsPage = 0;
    this.agentsWithProductsLast = true;
    this.agentSearchTerms.next(term);
  }

  changePage(page: number): void {
    if (this.selectedAgentId && page >= 0 && page < this.totalPages && page !== this.page) this.loadProductsByAgent(this.selectedAgentId, page);
  }

  changePageSize(size: string): void {
    this.pagination.pageSize = Number(size) || DEFAULT_PAGE_SIZE;
    if (this.selectedAgentId) this.loadProductsByAgent(this.selectedAgentId, 0);
  }

  loadAgents(): void {
    this.loadAllAgents();
  }

  private loadAllAgents(page = 0, collected: AgentResponse[] = []): void {
    this.agentService.getAllAgents({ page, size: 100 }).subscribe({
      next: data => {
        const allAgents = [...collected, ...data.content];
        if (!data.last) {
          this.loadAllAgents(page + 1, allAgents);
          return;
        }
        this.zone.run(() => {
          this.agents = allAgents;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.productError = 'No se pudieron cargar los agentes.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadAgentsWithProducts(): void {
    if (this.isLoadingAgentsWithProducts || this.agentsWithProductsLast && this.agentsWithProducts.length) return;
    this.isLoadingAgentsWithProducts = true;
    this.agentsWithProductsError = '';
    const request$ = this.agentSearchTerm
      ? this.agentService.searchAgents(this.agentSearchTerm, { page: this.agentsWithProductsPage, size: 10 })
      : this.agentService.getAgentsWithProducts({ page: this.agentsWithProductsPage, size: 10 });
    request$.subscribe({
      next: data => this.zone.run(() => {
        this.agentsWithProducts = [...this.agentsWithProducts, ...data.content];
        this.agentsWithProductsPage = data.number + 1;
        this.agentsWithProductsLast = data.last;
        this.isLoadingAgentsWithProducts = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.isLoadingAgentsWithProducts = false;
        this.agentsWithProductsError = 'No se pudieron cargar los agentes con productos.';
        this.cdr.detectChanges();
      })
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: data => {
        this.zone.run(() => {
          this.categories = data;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.categoryError = 'No se pudieron cargar las categorias.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  openProductModal(template: TemplateRef<any>): void {
    this.resetProductForm();
    this.productForm.agendId = this.selectedAgentId ?? 0;
    this.modalRef = this.modalService.show(template);
  }

  openCategoryModal(template: TemplateRef<any>): void {
    this.newCategoryName = '';
    this.categoryError = '';
    this.editingCategoryId = null;
    this.editingCategoryName = '';
    this.modalRef = this.modalService.show(template);
  }

  openEditProductModal(template: TemplateRef<any>, product: ProductResponse): void {
    this.productForm = {
      name: product.name ?? '',
      quantity: product.quantity ?? 0,
      price: product.price ?? 0,
      cost: product.cost ?? 0,
      unitType: product.unitType ?? '',
      categoryId: this.categories.find(category => category.name === product.categoryName)?.id ?? 0,
      agendId: this.selectedAgentId ?? this.agents.find(agent => agent.name === product.agentName)?.id ?? 0
    };
    this.productError = '';
    this.productFormAgentSearchTerm = '';
    this.productFormCategorySearchTerm = '';
    this.productFormSubmitted = false;
    this.editingProductId = product.id;
    this.modalRef = this.modalService.show(template);
  }

  resetProductForm(): void {
    this.productForm = {
      name: '',
      quantity: 0,
      price: 0,
      cost: 0,
      unitType: '',
      categoryId: 0,
      agendId: 0
    };
    this.productError = '';
    this.productFormAgentSearchTerm = '';
    this.productFormCategorySearchTerm = '';
    this.productFormSubmitted = false;
    this.editingProductId = null;
  }

  createCategory(): void {
    const trimmedName = this.newCategoryName.trim();
    if (!trimmedName || this.isSavingCategory) {
      return;
    }

    this.isSavingCategory = true;
    this.categoryError = '';

    this.categoryService.createCategory(trimmedName).pipe(
      finalize(() => {
        this.isSavingCategory = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.loadCategories();
          this.newCategoryName = '';
          this.modalRef?.hide();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.categoryError = 'No se pudo crear la categoria.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  startEditCategory(category: CategoryResponse): void {
    this.categoryError = '';
    this.editingCategoryId = category.id;
    this.editingCategoryName = category.name;
  }

  cancelEditCategory(): void {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  updateCategory(category: CategoryResponse): void {
    const trimmedName = this.editingCategoryName.trim();
    if (!trimmedName || this.isSavingCategory) {
      return;
    }

    this.isSavingCategory = true;
    this.categoryError = '';

    this.categoryService.updateCategory(category.id, trimmedName).pipe(
      finalize(() => {
        this.isSavingCategory = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          const index = this.categories.findIndex(item => item.id === category.id);
          if (index >= 0) {
            this.categories = replaceById(this.categories, { ...category, name: trimmedName });
          } else {
            this.loadCategories();
          }
          this.cancelEditCategory();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.categoryError = 'No se pudo actualizar la categoria.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteCategory(category: CategoryResponse): void {
    if (this.isSavingCategory) {
      return;
    }

    const confirmed = confirm(`Eliminar "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingCategory = true;
    this.categoryError = '';

    this.categoryService.deleteCategory(category.id).pipe(
      finalize(() => {
        this.isSavingCategory = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.categories = removeById(this.categories, category.id);
          if (this.editingCategoryId === category.id) {
            this.cancelEditCategory();
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.categoryError = 'No se pudo eliminar la categoria.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  saveProduct(): void {
    if (this.isSavingProduct) {
      return;
    }

    this.productFormSubmitted = true;
    if (!this.productForm.name.trim()) {
      this.productError = 'El nombre es obligatorio.';
      return;
    }

    if (!this.productForm.agendId) {
      this.productError = 'Selecciona un agente.';
      return;
    }

    this.isSavingProduct = true;
    this.productError = '';

    const request: ProductRequest = {
      ...this.productForm,
      name: this.productForm.name.trim()
    };

    const request$ = this.editingProductId
      ? this.productService.updateProduct(this.editingProductId, request)
      : this.productService.createProduct(request);

    request$.pipe(
      finalize(() => {
        this.isSavingProduct = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          const agentId = this.productForm.agendId || this.selectedAgentId;
          if (agentId) {
            this.selectedAgentId = agentId;
            this.loadProductsByAgent(agentId, 0);
          } else {
            this.products = [];
          }
          this.resetProductForm();
          this.modalRef?.hide();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.productError = this.editingProductId
            ? 'No se pudo actualizar el producto.'
            : 'No se pudo guardar el producto.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteProduct(product: ProductResponse): void {
    if (this.isSavingProduct) {
      return;
    }

    const confirmed = confirm(`Eliminar "${product.name}"?`);
    if (!confirmed) {
      return;
    }

    const pageAfterDelete = this.products.length === 1 && this.page > 0 ? this.page - 1 : this.page;
    this.isSavingProduct = true;
    this.productError = '';

    this.productService.deleteProduct(product.id).pipe(
      finalize(() => {
        this.isSavingProduct = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.products = removeById(this.products, product.id);
          if (this.selectedAgentId) {
            this.loadProductsByAgent(this.selectedAgentId, pageAfterDelete);
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.productError = 'No se pudo eliminar el producto.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  isProductNameInvalid(): boolean {
    return this.productFormSubmitted && !this.productForm.name.trim();
  }

  isAgentInvalid(): boolean {
    return this.productFormSubmitted && !this.productForm.agendId;
  }

  isCategoryInvalid(): boolean {
    return this.productFormSubmitted && !this.productForm.categoryId;
  }

  trackByProductId(index: number, product: ProductResponse): number {
    return product.id;
  }

  trackByAgentId(index: number, agent: AgentResponse): number {
    return agent.id;
  }

  trackByCategoryId(index: number, category: CategoryResponse): number {
    return category.id;
  }
}
