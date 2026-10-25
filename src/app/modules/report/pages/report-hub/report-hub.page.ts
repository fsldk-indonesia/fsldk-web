import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { reportPath } from '../../report.path';

type ReportTier = 'LDK' | 'PUSKOMDA' | 'PUSKOMNAS';

@Component({
  selector: 'app-report-hub-page',
  standalone: true,
  templateUrl: './report-hub.page.html',
  imports: [IconComponent, RouterLink],
  styles: [`
    .page-head { margin-bottom: 28px; } .page-head h1 { margin-bottom: 2px; }
    .hub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
    .hub-card { display: flex; flex-direction: column; gap: 12px; padding: 24px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: #fff; text-decoration: none; color: inherit; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease; }
    .hub-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
    .hub-card h3 { margin: 0; }
    .hub-card p { margin: 0; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class ReportHubPage {
  private route = inject(ActivatedRoute);
  title = this.route.snapshot.data['title'] as string;
  readonly path = reportPath;

  /** Shell saat ini ditentukan prefix URL (cms-ldk vs cms-puskomda vs
   *  cms-puskomnas) — dibaca dari absolute URL sendiri (bukan route data
   *  `tier`, yang di-set di parent cms-ldk/cms-puskomda/cms-puskomnas route
   *  tapi tidak otomatis ter-inherit ke child route's snapshot.data tanpa
   *  paramsInheritanceStrategy: 'always', yang tidak diaktifkan di app ini —
   *  sama pendekatan dengan versi 2-tier sebelumnya, diperluas jadi 3 tier). */
  tier: ReportTier = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-ldk'))
    ? 'LDK'
    : this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-puskomnas'))
      ? 'PUSKOMNAS'
      : 'PUSKOMDA';

  get isLdk(): boolean { return this.tier === 'LDK'; }
  private get isNasional(): boolean { return this.tier === 'PUSKOMNAS'; }

  get levelisasiPath(): string { return this.isNasional ? this.path.levelisasiNasional : this.path.levelisasiWilayah; }
  get pendataanPath(): string { return this.isNasional ? this.path.pendataanNasional : this.path.pendataanWilayah; }
  get sensusKaderPath(): string {
    if (this.isLdk) return this.path.sensusKaderLdk;
    return this.isNasional ? this.path.sensusKaderNasional : this.path.sensusKaderWilayah;
  }
  get pendataanSensusKaderPath(): string {
    if (this.isLdk) return this.path.pendataanSensusKaderLdk;
    return this.isNasional ? this.path.pendataanSensusKaderNasional : this.path.pendataanSensusKaderWilayah;
  }
}
