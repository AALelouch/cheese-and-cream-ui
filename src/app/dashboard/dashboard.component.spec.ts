import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AgentService } from '../agents/agent.service';
import { DashboardService } from './dashboard.service';
import { DashboardComponent } from './dashboard.component';

const metrics = { totalRevenue: 100, totalProfit: 40, pendingBalance: 12 };

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let dashboard: { getMonthlyMetrics: ReturnType<typeof vi.fn>; getTotalPendingBalance: ReturnType<typeof vi.fn>; getMonthlyPendingBalance: ReturnType<typeof vi.fn>; getAgentPendingBalance: ReturnType<typeof vi.fn> };
  let agents: { searchAgents: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dashboard = {
      getMonthlyMetrics: vi.fn(() => of(metrics)), getTotalPendingBalance: vi.fn(() => of(30)),
      getMonthlyPendingBalance: vi.fn(() => of(12)), getAgentPendingBalance: vi.fn(() => of(8))
    };
    agents = { searchAgents: vi.fn(() => of({ content: [], number: 0, last: true })) };
    await TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [
      { provide: DashboardService, useValue: dashboard }, { provide: AgentService, useValue: agents }
    ] }).compileComponents();
    component = TestBed.createComponent(DashboardComponent).componentInstance;
  });

  it('combines the three monthly dashboard sources into a ready view state', () => {
    component.loadDashboard(5);

    expect(dashboard.getMonthlyMetrics).toHaveBeenCalledWith(5);
    expect(component.selectedMonth()).toBe(5);
    expect(component.metrics()).toEqual(metrics);
    expect(component.totalPendingBalance()).toBe(30);
    expect(component.monthlyPendingBalance()).toBe(12);
    expect(component.isLoading()).toBe(false);
  });

  it('retains a useful error when any dashboard source fails', () => {
    dashboard.getMonthlyMetrics.mockReturnValue(throwError(() => new Error('offline')));
    component.loadDashboard(5);
    expect(component.error()).toContain('No se pudieron cargar');
    expect(component.isLoading()).toBe(false);
  });

  it('ignores the balance result for an agent that is no longer selected', () => {
    const first = new Subject<number>();
    const second = new Subject<number>();
    dashboard.getAgentPendingBalance.mockImplementation((id: number) => id === 1 ? first : second);
    component.selectAgent(1);
    component.selectAgent(2);
    first.next(99);
    expect(component.agentPendingBalance()).toBeNull();
    second.next(25);
    expect(component.agentPendingBalance()).toBe(25);
    expect(component.isLoadingAgentBalance()).toBe(false);
  });

  it('clears the selected balance and invalidates its pending request', () => {
    const response = new Subject<number>();
    dashboard.getAgentPendingBalance.mockReturnValue(response);
    component.selectAgent(1);
    component.clearAgentSelection();
    response.next(8);

    expect(component.selectedAgentId()).toBeNull();
    expect(component.agentPendingBalance()).toBeNull();
  });
});
