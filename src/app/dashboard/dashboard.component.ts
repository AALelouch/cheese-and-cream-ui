import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, forkJoin, Subject, switchMap } from 'rxjs';
import { AgentResponse } from '../agents/agent';
import { AgentService } from '../agents/agent.service';
import { DashboardMetrics } from './dashboard';
import { DashboardService } from './dashboard.service';
import { LucideChartNoAxesCombined, LucideCircleAlert, LucideClock3, LucideCoins, LucideLoaderCircle, LucideRefreshCw, LucideUserRoundCheck, LucideWalletCards, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, LucideChartNoAxesCombined, LucideCircleAlert, LucideClock3, LucideCoins, LucideLoaderCircle, LucideRefreshCw, LucideUserRoundCheck, LucideWalletCards, LucideX],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly agentService = inject(AgentService);

  readonly months = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly agents = signal<AgentResponse[]>([]);
  readonly metrics = signal<DashboardMetrics | null>(null);
  readonly totalPendingBalance = signal<number | null>(null);
  readonly monthlyPendingBalance = signal<number | null>(null);
  readonly agentPendingBalance = signal<number | null>(null);
  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedAgentId = signal<number | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingAgentBalance = signal(false);
  readonly error = signal('');
  readonly agentBalanceError = signal('');
  readonly agentSearchTerm = signal('');
  readonly isSearchingAgents = signal(false);
  readonly agentSearchError = signal('');
  readonly agentsSearchPage = signal(0);
  readonly agentsSearchLast = signal(true);
  private dashboardRequestId = 0;
  private agentBalanceRequestId = 0;
  private readonly agentSearchTerms = new Subject<string>();

  ngOnInit(): void {
    this.agentSearchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearchingAgents.set(true);
        this.agentSearchError.set('');
        return this.agentService.searchAgents(term, { page: 0, size: 10 }).pipe(catchError(() => {
          this.isSearchingAgents.set(false);
          this.agentSearchError.set('No se pudieron buscar los agentes.');
          return EMPTY;
        }));
      })
    ).subscribe(data => {
      this.agents.set(data.content);
      this.agentsSearchPage.set(data.number + 1);
      this.agentsSearchLast.set(data.last);
      this.isSearchingAgents.set(false);
    });
    this.onAgentSearchChange('');
    this.loadDashboard(this.selectedMonth());
  }

  loadDashboard(month: number): void {
    const requestId = ++this.dashboardRequestId;
    this.selectedMonth.set(month);
    this.isLoading.set(true);
    this.error.set('');

    forkJoin({
      metrics: this.dashboardService.getMonthlyMetrics(month),
      totalPendingBalance: this.dashboardService.getTotalPendingBalance(),
      monthlyPendingBalance: this.dashboardService.getMonthlyPendingBalance(month)
    }).subscribe({
      next: data => {
        if (requestId !== this.dashboardRequestId) return;
        this.metrics.set(data.metrics);
        this.totalPendingBalance.set(data.totalPendingBalance);
        this.monthlyPendingBalance.set(data.monthlyPendingBalance);
        this.isLoading.set(false);
      },
      error: () => {
        if (requestId !== this.dashboardRequestId) return;
        this.error.set('No se pudieron cargar los datos del panel. Comprueba la conexión con la API e inténtalo de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  onAgentSearchChange(term: string): void {
    this.agentSearchTerm.set(term);
    this.agentSearchTerms.next(term);
  }

  loadMoreAgents(): void {
    if (this.isSearchingAgents() || this.agentsSearchLast()) return;
    this.isSearchingAgents.set(true);
    this.agentService.searchAgents(this.agentSearchTerm(), { page: this.agentsSearchPage(), size: 10 }).subscribe({
      next: data => {
        this.agents.update(agents => [...agents, ...data.content]);
        this.agentsSearchPage.set(data.number + 1);
        this.agentsSearchLast.set(data.last);
        this.isSearchingAgents.set(false);
      },
      error: () => {
        this.isSearchingAgents.set(false);
        this.agentSearchError.set('No se pudieron cargar más agentes.');
      }
    });
  }

  selectAgent(agentId: number): void {
    const requestId = ++this.agentBalanceRequestId;
    this.selectedAgentId.set(agentId);
    this.agentPendingBalance.set(null);
    this.agentBalanceError.set('');
    this.isLoadingAgentBalance.set(true);

    this.dashboardService.getAgentPendingBalance(agentId).subscribe({
      next: balance => {
        if (requestId !== this.agentBalanceRequestId || this.selectedAgentId() !== agentId) return;
        this.agentPendingBalance.set(balance);
        this.isLoadingAgentBalance.set(false);
      },
      error: () => {
        if (requestId !== this.agentBalanceRequestId || this.selectedAgentId() !== agentId) return;
        this.agentBalanceError.set('No se pudo cargar el saldo del cliente seleccionado.');
        this.isLoadingAgentBalance.set(false);
      }
    });
  }

  clearAgentSelection(): void {
    this.agentBalanceRequestId++;
    this.selectedAgentId.set(null);
    this.agentPendingBalance.set(null);
    this.agentBalanceError.set('');
  }

  onMonthChange(event: Event): void {
    const month = Number((event.target as HTMLSelectElement).value);
    this.loadDashboard(month);
  }

  onAgentChange(event: Event): void {
    const agentId = Number((event.target as HTMLSelectElement).value);
    if (agentId) {
      this.selectAgent(agentId);
    }
  }

  formatMonth(month: number): string {
    return new Date(2024, month - 1, 1).toLocaleString('es-ES', { month: 'long' });
  }
}
