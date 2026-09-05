import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { NetworkStats, DirectoryEntry } from '../../entities/statistic';
import { StatisticIndexPresenter } from './statistic.index.presenter';
import { StatisticIndexView } from './statistic.index.view';

Chart.register(...registerables);

type TabId = 'ringkasan' | 'provinsi' | 'level' | 'direktori';

const TYPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'LDK', label: 'LDK' },
  { value: 'PUSKOMDA', label: 'Puskomda' },
  { value: 'PUSKOMNAS', label: 'Puskomnas' },
];

const TYPE_LABELS: Record<string, string> = { LDK: 'LDK', PUSKOMDA: 'Puskomda', PUSKOMNAS: 'Puskomnas' };

@Component({
  selector: 'app-statistic-index-page',
  standalone: true,
  templateUrl: './statistic.index.page.html',
  imports: [FormsModule, IconComponent, SelectComponent, PaginationComponent],
  providers: [StatisticIndexPresenter],
  styles: [`
    :host { display: block; }
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); min-height: 85vh; padding-top: 48px; }
    .page-header { margin-bottom: 40px; text-align: center; }
    .page-header h1 { font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 800; color: var(--color-text); margin: 6px 0 10px; letter-spacing: -.02em; }
    .page-subtitle { max-width: 620px; margin: 0 auto; font-size: 1.05rem; color: var(--color-text-secondary); }

    .tab-bar { display: flex; justify-content: center; gap: 6px; margin-bottom: 32px; flex-wrap: wrap; }
    .tab-btn { padding: 10px 20px; border-radius: var(--radius-full); border: 1px solid var(--color-border); background: #fff; color: var(--color-text); font-weight: 600; font-size: .92rem; cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .tab-btn:hover { background: var(--color-primary-soft); }
    .tab-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; max-width: 980px; margin: 0 auto; }
    .stat-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 28px 20px; text-align: center; box-shadow: var(--shadow-sm); }
    .stat-card b { display: block; font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--color-primary-dark); }
    .stat-card span { font-size: .88rem; color: var(--color-text-secondary); font-weight: 600; }
    @media (max-width: 720px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }

    .chart-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 28px; max-width: 900px; margin: 0 auto; box-shadow: var(--shadow-sm); }
    .chart-card h3 { margin: 0 0 20px; text-align: center; }
    .chart-wrap { position: relative; }
    .chart-wrap.province { height: 640px; }
    .chart-wrap.level { height: 340px; max-width: 420px; margin: 0 auto; }

    .directory-toolbar { display: flex; gap: 10px; flex-wrap: wrap; max-width: 900px; margin: 0 auto 24px; }
    .directory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; max-width: 980px; margin: 0 auto; }
    .org-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 20px; text-align: center; }
    .org-logo { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 12px; object-fit: cover; border: 1px solid var(--color-border); }
    .org-logo-fallback { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 12px; background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; }
    .org-card h4 { margin: 0 0 4px; font-size: .98rem; }
    .org-meta { font-size: .8rem; color: var(--color-muted); margin: 0 0 8px; }

    .empty-note { text-align: center; color: var(--color-muted); padding: 40px 0; }
  `],
})
export class StatisticIndexPage implements OnInit, OnDestroy, StatisticIndexView {
  private presenter = inject(StatisticIndexPresenter);

  activeTab = signal<TabId>('ringkasan');
  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'ringkasan', label: 'Ringkasan' },
    { id: 'provinsi', label: 'Sebaran Provinsi' },
    { id: 'level', label: 'Level LDK' },
    { id: 'direktori', label: 'Direktori LDK' },
  ];

  stats = signal<NetworkStats | null>(null);
  statsLoading = signal(true);

  directory = signal<DirectoryEntry[]>([]);
  directoryLoading = signal(true);
  directoryCount = signal(0);
  directoryPage = signal(1);
  readonly directoryLimit = 12;
  directorySearch = '';
  directoryType = '';
  directoryProvince = '';
  private directoryLoadedOnce = false;

  readonly typeOptions = TYPE_OPTIONS;
  provinceOptions = computed(() => [
    { value: '', label: 'Semua Provinsi' },
    ...(this.stats()?.byProvince.map((p) => ({ value: p.provinceName, label: p.provinceName })) ?? []),
  ]);

  private provinceChart: Chart | null = null;
  private levelChart: Chart | null = null;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.statsLoading.set(true);
    this.presenter.loadStats();
  }

  ngOnDestroy(): void {
    this.provinceChart?.destroy();
    this.levelChart?.destroy();
  }

  switchTab(tab: TabId): void {
    this.activeTab.set(tab);
    if (tab === 'provinsi' || tab === 'level') {
      setTimeout(() => this.renderCharts(), 0);
    }
    if (tab === 'direktori' && !this.directoryLoadedOnce) {
      this.directoryLoadedOnce = true;
      this.loadDirectory();
    }
  }

  loadDirectory(): void {
    this.directoryLoading.set(true);
    this.presenter.loadDirectory(this.directoryPage(), this.directoryLimit, this.directorySearch, this.directoryType, this.directoryProvince);
  }
  applyDirectoryFilter(): void { this.directoryPage.set(1); this.loadDirectory(); }
  goDirectoryPage(p: number): void { this.directoryPage.set(p); this.loadDirectory(); }

  typeLabel(code: string): string { return TYPE_LABELS[code] ?? code; }

  private renderCharts(): void {
    const stats = this.stats();
    if (!stats) return;

    this.provinceChart?.destroy();
    this.provinceChart = null;
    const provinceCanvas = document.getElementById('provinceChart') as HTMLCanvasElement | null;
    if (provinceCanvas && stats.byProvince.length > 0) {
      this.provinceChart = new Chart(provinceCanvas, {
        type: 'bar',
        data: {
          labels: stats.byProvince.map((p) => p.provinceName),
          datasets: [{ label: 'Jumlah LDK', data: stats.byProvince.map((p) => p.count), backgroundColor: '#00933b' }],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    this.levelChart?.destroy();
    this.levelChart = null;
    const levelCanvas = document.getElementById('levelChart') as HTMLCanvasElement | null;
    if (levelCanvas && stats.byLevel.length > 0) {
      this.levelChart = new Chart(levelCanvas, {
        type: 'doughnut',
        data: {
          labels: stats.byLevel.map((l) => l.levelLabel),
          datasets: [{ data: stats.byLevel.map((l) => l.count), backgroundColor: ['#00933b', '#00b34d', '#5cd685', '#a7ecc0', '#d7f3e2'] }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    }
  }

  setStats(stats: NetworkStats): void {
    this.stats.set(stats);
    this.statsLoading.set(false);
    if (this.activeTab() === 'provinsi' || this.activeTab() === 'level') {
      setTimeout(() => this.renderCharts(), 0);
    }
  }
  setStatsError(): void { this.statsLoading.set(false); }

  setDirectory(items: DirectoryEntry[], count: number): void {
    this.directory.set(items);
    this.directoryCount.set(count);
    this.directoryLoading.set(false);
  }
  setDirectoryError(): void { this.directoryLoading.set(false); }
}
