import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BsModalService } from 'ngx-bootstrap/modal';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OperatingCostService } from './operating-cost.service';
import { OperatingCostsComponent } from './operating-costs.component';

const page = <T>(content: T[], number = 0, last = true) => ({ content, number, last, totalElements: content.length, totalPages: content.length ? number + 1 : 0, size: 10, numberOfElements: content.length, first: number === 0, empty: !content.length });
const operatingCost = { id: 17, concept: 'Arriendo', amount: 1200000, date: '2026-09-29T14:35:42.123' };

describe('OperatingCostsComponent', () => {
  let component: OperatingCostsComponent;
  let service: { getOperatingCosts: ReturnType<typeof vi.fn>; getOperatingCostsByMonth: ReturnType<typeof vi.fn>; searchOperatingCosts: ReturnType<typeof vi.fn>; createOperatingCost: ReturnType<typeof vi.fn>; updateOperatingCost: ReturnType<typeof vi.fn>; deleteOperatingCost: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      getOperatingCosts: vi.fn(() => of(page([]))),
      getOperatingCostsByMonth: vi.fn(() => of(page([]))),
      searchOperatingCosts: vi.fn(() => of(page([]))),
      createOperatingCost: vi.fn(() => of(void 0)),
      updateOperatingCost: vi.fn(() => of(void 0)),
      deleteOperatingCost: vi.fn(() => of(void 0))
    };
    await TestBed.configureTestingModule({
      imports: [OperatingCostsComponent],
      providers: [
        { provide: OperatingCostService, useValue: service },
        { provide: BsModalService, useValue: { show: vi.fn(() => ({ hide: vi.fn() })) } },
        { provide: ChangeDetectorRef, useValue: { detectChanges: vi.fn() } }
      ]
    }).compileComponents();
    component = TestBed.createComponent(OperatingCostsComponent).componentInstance;
  });

  it('loads the first page on initialization', () => {
    component.ngOnInit();

    expect(service.getOperatingCosts).toHaveBeenCalledWith({ page: 0, size: 10 });
  });

  it('validates the concept and a finite amount before persisting', () => {
    component.saveOperatingCost();
    expect(component.operatingCostFormError).toBe('El concepto es obligatorio.');

    component.operatingCostForm = { concept: 'Arriendo', amount: 0 };
    component.saveOperatingCost();
    expect(component.operatingCostFormError).toBe('Ingresa un monto mayor a cero.');
    expect(service.createOperatingCost).not.toHaveBeenCalled();
  });

  it('trims the request and reloads server state after creation', () => {
    component.operatingCostForm = { concept: '  Arriendo ', amount: 1200000 };
    component.saveOperatingCost();

    expect(service.createOperatingCost).toHaveBeenCalledWith({ concept: 'Arriendo', amount: 1200000 });
    expect(service.getOperatingCosts).toHaveBeenCalledWith({ page: 0, size: 10 });
  });

  it('uses the update operation when editing an existing cost', () => {
    component.editingOperatingCostId = 17;
    component.operatingCostForm = { concept: 'Arriendo', amount: 1250000 };
    component.saveOperatingCost();

    expect(service.updateOperatingCost).toHaveBeenCalledWith(17, { concept: 'Arriendo', amount: 1250000 });
    expect(service.createOperatingCost).not.toHaveBeenCalled();
  });

  it('keeps load failures separate from form failures', () => {
    service.getOperatingCosts.mockReturnValue(throwError(() => new Error('offline')));
    component.loadOperatingCosts(0);

    expect(component.operatingCostsLoadError).toBe('No se pudieron cargar los costos operativos.');
    expect(component.operatingCostFormError).toBe('');
  });

  it('loads operating costs through the month endpoint', () => {
    component.searchTerm = 'old search';
    component.selectedMonth = 9;
    component.selectedYear = 2026;

    component.applyMonthFilter();

    expect(component.searchTerm).toBe('');
    expect(service.getOperatingCostsByMonth).toHaveBeenCalledWith(9, 2026, { page: 0, size: 10 });
  });

  it('searches the same term again after the search is cleared', async () => {
    vi.useFakeTimers();
    try {
      component.ngOnInit();

      component.onSearchChange('arriendo');
      await vi.advanceTimersByTimeAsync(300);
      const firstSearchCallCount = service.searchOperatingCosts.mock.calls.length;
      component.onSearchChange('');
      await vi.advanceTimersByTimeAsync(300);
      const listCallCountAfterClear = service.getOperatingCosts.mock.calls.length;
      component.onSearchChange('arriendo');
      await vi.advanceTimersByTimeAsync(300);

      expect(service.searchOperatingCosts.mock.calls.length).toBeGreaterThan(firstSearchCallCount);
      expect(listCallCountAfterClear).toBeGreaterThan(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
