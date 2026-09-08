import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { IconComponent } from '../../../../shared/icon.component';
import { StatBarComponent } from '../../../../shared/stat-bar.component';
import { LevelCount, PuskomdaBreakdown, StatusCounts } from '../../entities/dashboard-summary';
import { CHART_COLORS, STATUS_BUCKET_COLORS, STATUS_BUCKET_LABELS } from './chart-colors';

Chart.register(...registerables);

/**
 * Rekap status pendataan + distribusi level + sebaran per Puskomda — satu
 * bentuk visual (stat-bar + Chart.js) dipakai baik oleh dashboard Puskomnas
 * maupun (atas permintaan eksplisit) dashboard CMS Utama, yang menampilkan
 * ringkasan jaringan nasional yang SAMA persis supaya Super Admin tidak perlu
 * pindah shell ke cms-puskomnas hanya untuk melihat kondisi jaringan ini.
 * `levelDistribution`/`perPuskomda` opsional — Puskomda (yang tidak punya
 * kedua data ini) cukup memakai `statusCounts`/`statusMax` saja.
 */
@Component({
  selector: 'app-network-breakdown-charts',
  standalone: true,
  imports: [IconComponent, StatBarComponent],
  template: `
    @if (statusCounts; as sc) {
      <div class="card-section">
        <h3><app-icon name="list-checks" [size]="18" /> Rekap Status Pendataan {{ scopeLabel }}</h3>
        <app-stat-bar label="Belum Mengisi" [value]="sc.belumMengisi" [max]="statusMax" />
        <app-stat-bar label="Menunggu Verifikasi" [value]="sc.menungguVerifikasi" [max]="statusMax" />
        <app-stat-bar label="Perlu Revisi" [value]="sc.perluRevisi" [max]="statusMax" />
        <app-stat-bar label="Terverifikasi" [value]="sc.terverifikasi" [max]="statusMax" />
      </div>
      <div class="card-section">
        <h3><app-icon name="chart-pie" [size]="18" /> Proporsi Status Pendataan {{ scopeLabel }}</h3>
        <div class="chart-box"><canvas [id]="idPrefix + '-status'"></canvas></div>
      </div>
    }

    @if (levelDistribution.length) {
      <div class="card-section">
        <h3><app-icon name="award" [size]="18" /> Distribusi Level</h3>
        @for (l of levelDistribution; track l.levelCode) {
          <app-stat-bar [label]="l.levelLabel || l.levelCode" [value]="l.count" [max]="levelDistMax()" />
        }
      </div>
      <div class="card-section">
        <h3><app-icon name="chart-bar" [size]="18" /> Grafik Distribusi Level</h3>
        <div class="chart-box"><canvas [id]="idPrefix + '-level'"></canvas></div>
      </div>
    }

    @if (perPuskomda.length) {
      <div class="card-section">
        <h3><app-icon name="building-2" [size]="18" /> Sebaran per Puskomda</h3>
        <table class="breakdown-table">
          <thead><tr><th>Puskomda</th><th>Total LDK</th><th>Kader Aktif</th></tr></thead>
          <tbody>
            @for (row of perPuskomda; track row.organizationID) {
              <tr>
                <td>{{ row.organizationName }}</td>
                <td>{{ row.totalLDK }}</td>
                <td>{{ row.kaderAktif }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="card-section">
        <h3><app-icon name="chart-bar" [size]="18" /> Grafik Sebaran per Puskomda</h3>
        <div class="chart-box" [style.height.px]="perPuskomdaChartHeight()"><canvas [id]="idPrefix + '-perPuskomda'"></canvas></div>
      </div>
    }
  `,
  styles: [`
    .card-section { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); margin-top: 20px; }
    .card-section h3 { margin: 0 0 16px; display: flex; align-items: center; gap: 9px; }
    .breakdown-table { width: 100%; border-collapse: collapse; }
    .breakdown-table th, .breakdown-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--color-border); font-size: .9rem; }
    .breakdown-table th { color: var(--color-text-secondary); font-weight: 600; }
    .chart-box { position: relative; height: 280px; }
  `],
})
export class NetworkBreakdownChartsComponent implements OnChanges, OnDestroy {
  @Input() statusCounts: StatusCounts | null = null;
  @Input() statusMax = 0;
  @Input() levelDistribution: LevelCount[] = [];
  @Input() perPuskomda: PuskomdaBreakdown[] = [];
  @Input() scopeLabel = 'Wilayah';
  @Input() idPrefix = 'nb';

  private statusChart: Chart | null = null;
  private levelChart: Chart | null = null;
  private perPuskomdaChart: Chart | null = null;

  levelDistMax(): number {
    return Math.max(1, ...this.levelDistribution.map((l) => l.count));
  }

  perPuskomdaChartHeight(): number {
    return Math.max(220, this.perPuskomda.length * 34);
  }

  ngOnChanges(): void {
    // Kanvas baru ada di DOM setelah @if di atas merender ulang dengan input
    // baru — ditunda satu tick, pola sama dipakai dashboard.index.page.ts.
    setTimeout(() => this.renderCharts(), 0);
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.levelChart?.destroy();
    this.perPuskomdaChart?.destroy();
  }

  private renderCharts(): void {
    this.statusChart?.destroy();
    this.statusChart = null;
    if (this.statusCounts) {
      const canvas = document.getElementById(`${this.idPrefix}-status`) as HTMLCanvasElement | null;
      if (canvas) {
        const sc = this.statusCounts;
        this.statusChart = new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: STATUS_BUCKET_LABELS,
            datasets: [{ data: [sc.belumMengisi, sc.menungguVerifikasi, sc.perluRevisi, sc.terverifikasi], backgroundColor: STATUS_BUCKET_COLORS }],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
        });
      }
    }

    this.levelChart?.destroy();
    this.levelChart = null;
    if (this.levelDistribution.length) {
      const canvas = document.getElementById(`${this.idPrefix}-level`) as HTMLCanvasElement | null;
      if (canvas) {
        this.levelChart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: this.levelDistribution.map((l) => l.levelLabel || l.levelCode),
            datasets: [{ label: 'Jumlah LDK', data: this.levelDistribution.map((l) => l.count), backgroundColor: CHART_COLORS.primary, borderRadius: 6 }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
          },
        });
      }
    }

    this.perPuskomdaChart?.destroy();
    this.perPuskomdaChart = null;
    if (this.perPuskomda.length) {
      const canvas = document.getElementById(`${this.idPrefix}-perPuskomda`) as HTMLCanvasElement | null;
      if (canvas) {
        this.perPuskomdaChart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: this.perPuskomda.map((row) => row.organizationName),
            datasets: [{ label: 'Total LDK', data: this.perPuskomda.map((row) => row.totalLDK), backgroundColor: CHART_COLORS.primaryBright, borderRadius: 6 }],
          },
          options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
          },
        });
      }
    }
  }
}
