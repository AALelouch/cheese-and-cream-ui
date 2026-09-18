import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
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
  categories: CategoryResponse[] = [];
  selectedAgentId: number | null = null;
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

  ngOnInit(): void {
    this.loadAgents();
    this.loadCategories();
  }

  loadProductsByAgent(agentId: number, page = this.page): void {
    const requestId = ++this.productsRequestId;
    this.productService.getProductsByAgentId(agentId, { page, size: this.pageSize, sort: PRODUCT_DEFAULT_SORT }).subscribe({
      next: data => {
        if (requestId !== this.productsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.products = data.content;
          updatePaginationState(this.pagination, data);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        if (requestId !== this.productsRequestId || this.selectedAgentId !== agentId) return;
        this.zone.run(() => {
          this.productError = 'No se pudieron cargar los productos.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  selectAgent(agent: AgentResponse): void {
    this.selectedAgentId = agent.id;
    this.loadProductsByAgent(agent.id, 0);
  }

  clearAgentFilter(): void {
    this.productsRequestId++;
    this.selectedAgentId = null;
    this.products = [];
    this.pagination = createPaginationState(this.pageSize);
    this.cdr.detectChanges();
  }

  changePage(page: number): void {
    if (this.selectedAgentId && page >= 0 && page < this.totalPages && page !== this.page) this.loadProductsByAgent(this.selectedAgentId, page);
  }

  changePageSize(size: string): void {
    this.pagination.pageSize = Number(size) || DEFAULT_PAGE_SIZE;
    if (this.selectedAgentId) this.loadProductsByAgent(this.selectedAgentId, 0);
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
          this.productError = 'No se pudieron cargar los agentes.';
          this.cdr.detectChanges();
        });
      }
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
