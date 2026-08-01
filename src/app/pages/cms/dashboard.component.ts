import { Component, OnInit, inject, signal } from '@angular/core';
import { DashboardService } from '../../core/services/data.services';
import { DashboardSummary } from '../../core/models/models';

@Component({
  selector: 'app-cms-dashboard',
  standalone: true,
  template: `
    <div class="page-head"><h1>Dashboard</h1><p class="text-muted">Ringkasan aktivitas konten & pengguna.</p></div>

    <div class="grid grid-4">
      <div class="stat"><span class="stat-label">Total Berita</span><span class="stat-num">{{ s()?.totalNews ?? '–' }}</span></div>
      <div class="stat"><span class="stat-label">Dipublikasikan</span><span class="stat-num">{{ s()?.publishedNews ?? '–' }}</span></div>
      <div class="stat"><span class="stat-label">Draft</span><span class="stat-num">{{ s()?.draftNews ?? '–' }}</span></div>
      <div class="stat"><span class="stat-label">Total Pengguna</span><span class="stat-num">{{ s()?.totalUsers ?? '–' }}</span></div>
    </div>

    <div class="card card-pad mt-lg">
      <h3>Berita Terbaru</h3>
      <div class="table-wrap mt">
        <table class="table">
          <thead><tr><th>Judul</th><th>Status</th></tr></thead>
          <tbody>
            @for (n of recent(); track n.newsID) {
              <tr>
                <td>{{ n.newsTitle }}</td>
                <td><span class="badge" [class.badge-published]="n.isPublished" [class.badge-draft]="!n.isPublished">{{ n.isPublished ? 'Published' : 'Draft' }}</span></td>
              </tr>
            } @empty { <tr><td colspan="2" class="text-muted">Belum ada berita.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .stat { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
    .stat-label { color: var(--color-text-secondary); font-size: .9rem; } .stat-num { display: block; font-family: var(--font-heading); font-weight: 800; font-size: 2.6rem; margin-top: 8px; }
  `],
})
export class CmsDashboardComponent implements OnInit {
  private dash = inject(DashboardService);
  s = signal<DashboardSummary | null>(null);
  recent = signal<{ newsID: number; newsTitle: string; isPublished: boolean }[]>([]);

  ngOnInit(): void {
    this.dash.summary().subscribe({ next: (d) => this.s.set(d), error: () => {} });
    this.dash.recentNews().subscribe({ next: (r) => this.recent.set(r), error: () => {} });
  }
}
