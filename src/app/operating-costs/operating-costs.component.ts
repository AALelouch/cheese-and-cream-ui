import { ChangeDetectorRef, Component, NgZone, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, Subject, switchMap } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { createPaginationState, DEFAULT_PAGE_SIZE, updatePaginationState } from '../shared/pagination';
import { OperatingCostRequest, OperatingCostResponse } from './operating-cost';
import { OperatingCostService } from './operating-cost.service';

@Component({
  selector: 'app-operating-costs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operating-costs.component.html',
  styleUrls: ['./operating-costs.component.css']
})
export class OperatingCostsComponent implements OnInit {
  readonly months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  readonly minimumYear = 2026;
  readonly maximumYear = 2100;
  operatingCosts: OperatingCostResponse[] = [];
  searchTerm = '';
  selectedMonth: number | null = null;
  selectedYear = Math.max(this.minimumYear, new Date().getFullYear());
  isLoadingOperatingCosts = false;
  operatingCostsLoadError = '';
  operatingCostFormError = '';
  operatingCostFormSubmitted = false;
  isSavingOperatingCost = false;
  editingOperatingCostId: number | null = null;
  modalRef?: BsModalRef;
  operatingCostForm: OperatingCostRequest = { concept: '', amount: 0 };
  pagination = createPaginationState();
  private readonly searchTerms = new Subject<string>();
  private requestId = 0;

  constructor(
    private readonly operatingCostService: OperatingCostService,
    private readonly modalService: BsModalService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {}

  get page(): number { return this.pagination.page; }
  get pageSize(): number { return this.pagination.pageSize; }
  get totalElements(): number { return this.pagination.totalElements; }
  get totalPages(): number { return this.pagination.totalPages; }
  get first(): boolean { return this.pagination.first; }
  get last(): boolean { return this.pagination.last; }

  ngOnInit(): void {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isLoadingOperatingCosts = true;
        this.operatingCostsLoadError = '';
        return this.getCostsRequest(term, 0).pipe(catchError(() => {
          this.isLoadingOperatingCosts = false;
          this.operatingCostsLoadError = 'No se pudieron cargar los costos operativos.';
          this.cdr.detectChanges();
          return EMPTY;
        }));
      })
    ).subscribe(data => this.zone.run(() => {
      this.operatingCosts = data.content;
      updatePaginationState(this.pagination, data);
      this.isLoadingOperatingCosts = false;
      this.cdr.detectChanges();
    }));

    this.loadOperatingCosts(0);
  }

  loadOperatingCosts(page = this.page): void {
    const currentRequestId = ++this.requestId;
    this.isLoadingOperatingCosts = true;
    this.operatingCostsLoadError = '';
    this.getCostsRequest(this.searchTerm, page).subscribe({
      next: data => {
        if (currentRequestId !== this.requestId) return;
        this.zone.run(() => {
          this.operatingCosts = data.content;
          updatePaginationState(this.pagination, data);
          this.isLoadingOperatingCosts = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        if (currentRequestId !== this.requestId) return;
        this.zone.run(() => {
          this.isLoadingOperatingCosts = false;
          this.operatingCostsLoadError = 'No se pudieron cargar los costos operativos.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    if (term.trim()) this.selectedMonth = null;
    this.pagination.page = 0;
    this.requestId++;
    this.searchTerms.next(term);
  }

  applyMonthFilter(): void {
    if (this.selectedMonth === null || !this.isYearValid()) return;
    this.searchTerm = '';
    this.pagination.page = 0;
    this.requestId++;
    this.loadOperatingCosts(0);
  }

  clearMonthFilter(): void {
    this.selectedMonth = null;
    this.selectedYear = Math.max(this.minimumYear, new Date().getFullYear());
    this.loadOperatingCosts(0);
  }

  isYearValid(): boolean {
    return Number.isInteger(Number(this.selectedYear))
      && Number(this.selectedYear) >= this.minimumYear
      && Number(this.selectedYear) <= this.maximumYear;
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.page) this.loadOperatingCosts(page);
  }

  changePageSize(size: string): void {
    this.pagination.pageSize = Number(size) || DEFAULT_PAGE_SIZE;
    this.loadOperatingCosts(0);
  }

  openOperatingCostModal(template: TemplateRef<any>): void {
    this.resetOperatingCostForm();
    this.modalRef = this.modalService.show(template, { class: 'modal-dialog-centered operating-cost-modal' });
  }

  openEditOperatingCostModal(template: TemplateRef<any>, operatingCost: OperatingCostResponse): void {
    this.editingOperatingCostId = operatingCost.id;
    this.operatingCostForm = { concept: operatingCost.concept, amount: operatingCost.amount };
    this.operatingCostFormError = '';
    this.operatingCostFormSubmitted = false;
    this.modalRef = this.modalService.show(template, { class: 'modal-dialog-centered operating-cost-modal' });
  }

  saveOperatingCost(): void {
    if (this.isSavingOperatingCost) return;

    this.operatingCostFormSubmitted = true;
    if (!this.operatingCostForm.concept.trim()) {
      this.operatingCostFormError = 'El concepto es obligatorio.';
      return;
    }
    if (!this.isAmountValid()) {
      this.operatingCostFormError = 'Ingresa un monto mayor a cero.';
      return;
    }

    this.isSavingOperatingCost = true;
    this.operatingCostFormError = '';
    const request: OperatingCostRequest = {
      concept: this.operatingCostForm.concept.trim(),
      amount: Number(this.operatingCostForm.amount)
    };
    const request$ = this.editingOperatingCostId === null
      ? this.operatingCostService.createOperatingCost(request)
      : this.operatingCostService.updateOperatingCost(this.editingOperatingCostId, request);

    request$.pipe(finalize(() => {
      this.isSavingOperatingCost = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: () => this.zone.run(() => {
        this.loadOperatingCosts(this.page);
        this.modalRef?.hide();
        this.resetOperatingCostForm();
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.operatingCostFormError = this.editingOperatingCostId === null
          ? 'No se pudo guardar el costo operativo.'
          : 'No se pudo actualizar el costo operativo.';
        this.cdr.detectChanges();
      })
    });
  }

  deleteOperatingCost(operatingCost: OperatingCostResponse): void {
    if (this.isSavingOperatingCost || !confirm(`Eliminar "${operatingCost.concept}"?`)) return;

    const pageAfterDelete = this.operatingCosts.length === 1 && this.page > 0 ? this.page - 1 : this.page;
    this.isSavingOperatingCost = true;
    this.operatingCostsLoadError = '';
    this.operatingCostService.deleteOperatingCost(operatingCost.id).pipe(finalize(() => {
      this.isSavingOperatingCost = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: () => this.zone.run(() => {
        this.loadOperatingCosts(pageAfterDelete);
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.operatingCostsLoadError = 'No se pudo eliminar el costo operativo.';
        this.cdr.detectChanges();
      })
    });
  }

  isConceptInvalid(): boolean {
    return this.operatingCostFormSubmitted && !this.operatingCostForm.concept.trim();
  }

  isAmountInvalid(): boolean {
    return this.operatingCostFormSubmitted && !this.isAmountValid();
  }

  trackByOperatingCostId(index: number, operatingCost: OperatingCostResponse): number {
    return operatingCost.id;
  }

  private getCostsRequest(term: string, page: number) {
    const request = { page, size: this.pageSize };
    if (term.trim()) return this.operatingCostService.searchOperatingCosts(term, request);
    if (this.selectedMonth !== null) {
      return this.operatingCostService.getOperatingCostsByMonth(this.selectedMonth, Number(this.selectedYear), request);
    }
    return this.operatingCostService.getOperatingCosts(request);
  }

  private isAmountValid(): boolean {
    return Number.isFinite(Number(this.operatingCostForm.amount)) && Number(this.operatingCostForm.amount) > 0;
  }

  private resetOperatingCostForm(): void {
    this.operatingCostForm = { concept: '', amount: 0 };
    this.editingOperatingCostId = null;
    this.operatingCostFormError = '';
    this.operatingCostFormSubmitted = false;
  }
}
