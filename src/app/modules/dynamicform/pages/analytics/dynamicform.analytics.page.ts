import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { StatBarComponent } from '../../../../shared/stat-bar.component';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormAnalytics, FieldChart } from '../../entities/dynamic-form-analytics';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormAnalyticsPresenter } from './dynamicform.analytics.presenter';
import { DynamicFormAnalyticsView } from './dynamicform.analytics.view';

@Component({
  selector: 'app-dynamicform-analytics-page',
  standalone: true,
  templateUrl: './dynamicform.analytics.page.html',
  imports: [DatePipe, RouterLink, IconComponent, StatBarComponent],
  providers: [DynamicFormAnalyticsPresenter],
  styles: [`
    .page-head { margin-bottom: 22px; }
    .page-footer { display: flex; justify-content: flex-end; margin-top: 22px; }
    .page-head h1 { margin-bottom: 2px; }

    /* Kartu statistik ringkas — dipola sama seperti app-stat-tile (icon-badge +
       nilai/label) tapi bukan tautan navigasi, jadi dibuat lokal sebagai <div>. */
    .stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 22px; }
    @media (max-width: 980px) { .stat-row { grid-template-columns: repeat(2, 1fr); } }
    .stat-card {
      display: flex; align-items: center; gap: 14px; padding: 16px 18px; min-height: 84px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
    .stat-card-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .stat-card-value { font-family: var(--font-heading); font-weight: 800; font-size: 1.3rem; line-height: 1.25; color: var(--color-text); }
    .stat-card-label { font-size: .76rem; color: var(--color-text-secondary); font-weight: 600; line-height: 1.35; }

    .chart-block { margin-bottom: 16px; }
    .section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }

    .spark { display: flex; align-items: flex-end; gap: 4px; height: 110px; padding: 6px 2px 0; background: var(--color-bg-alt); border-radius: var(--radius-xs); box-shadow: inset 0 1px 3px rgba(0,0,0,.05); }
    .spark .bar { flex: 1; background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); border-radius: 3px 3px 0 0; min-height: 3px; transition: opacity var(--motion-fast) ease; }
    .spark .bar:hover { opacity: .75; }

    .field-chart + .field-chart { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--color-border); }
    .chart-empty { margin: 0; font-size: .86rem; color: var(--color-muted); }

    .table-wrap { border-radius: var(--radius-xs); overflow: hidden; }
  `],
})
export class DynamicFormAnalyticsPage implements OnInit, DynamicFormAnalyticsView {
  private presenter = inject(DynamicFormAnalyticsPresenter);
  private route = inject(ActivatedRoute);

  readonly path = dynamicFormPath;
  formId = Number(this.route.snapshot.paramMap.get('id'));
  form = signal<DynamicForm | null>(null);
  data = signal<DynamicFormAnalytics | null>(null);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.formId);
  }

  maxPerDay(): number {
    return Math.max(1, ...(this.data()?.submissionsPerDay ?? []).map((d) => d.count));
  }
  maxBucket(c: FieldChart): number {
    return Math.max(1, ...c.buckets.map((b) => b.count));
  }
  pct(count: number, max: number): number { return Math.round((count / max) * 100); }

  setForm(form: DynamicForm): void { this.form.set(form); }
  setAnalytics(data: DynamicFormAnalytics): void { this.data.set(data); }
}
