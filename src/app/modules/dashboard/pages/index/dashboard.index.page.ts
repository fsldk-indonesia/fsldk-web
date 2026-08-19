import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StatBarComponent } from '../../../../shared/stat-bar.component';
import { SUBMISSION_STATUS_LABELS } from '../../../submission/entities/submission';
import { DashboardSummary, PuskomdaBreakdown } from '../../entities/dashboard-summary';
import { DashboardIndexPresenter } from './dashboard.index.presenter';
import { DashboardIndexView } from './dashboard.index.view';

@Component({
  selector: 'app-dashboard-index-page',
  standalone: true,
  templateUrl: './dashboard.index.page.html',
  imports: [DatePipe, StatBarComponent],
  providers: [DashboardIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .stat { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
    .stat-label { color: var(--color-text-secondary); font-size: .9rem; } .stat-num { display: block; font-family: var(--font-heading); font-weight: 800; font-size: 2.6rem; margin-top: 8px; }
    .card-section { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); margin-top: 20px; }
    .card-section h3 { margin-bottom: 16px; }
    .notes-list { display: flex; flex-direction: column; gap: 12px; }
    .note-item { padding-bottom: 12px; border-bottom: 1px solid var(--color-border); }
    .note-item:last-child { border-bottom: none; padding-bottom: 0; }
    .note-item .note-date { color: var(--color-muted); font-size: .8rem; }
    .breakdown-table { width: 100%; border-collapse: collapse; }
    .breakdown-table th, .breakdown-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--color-border); font-size: .9rem; }
    .breakdown-table th { color: var(--color-text-secondary); font-weight: 600; }
  `],
})
export class DashboardIndexPage implements OnInit, DashboardIndexView {
  private presenter = inject(DashboardIndexPresenter);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  readonly statusLabels = SUBMISSION_STATUS_LABELS;

  puskomdaMax = computed(() => this.summary()?.puskomda?.totalLDK ?? 0);
  puskomnasMax = computed(() => this.summary()?.puskomnas?.totalLDKNasional ?? 0);
  levelDistMax = computed(() => Math.max(1, ...(this.summary()?.puskomnas?.levelDistribution.map((l) => l.count) ?? [1])));
  perPuskomdaLDKMax = computed(() => Math.max(1, ...(this.summary()?.puskomnas?.perPuskomda.map((p: PuskomdaBreakdown) => p.totalLDK) ?? [1])));

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  setSummary(summary: DashboardSummary): void { this.summary.set(summary); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
}
