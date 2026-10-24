import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { reportPath } from '../../report.path';

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
  /** Shell saat ini ditentukan prefix URL (cms-puskomda vs cms-puskomnas) —
   *  dibaca dari absolute URL sendiri (bukan route data `tier`, yang tidak
   *  diset di report.routes.ts) supaya card mengarah ke tier yang benar. */
  isNasional = this.route.snapshot.pathFromRoot.some((r) => r.url.some((seg) => seg.path === 'cms-puskomnas'));
}
