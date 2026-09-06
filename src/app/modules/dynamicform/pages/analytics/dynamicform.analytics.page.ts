import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormAnalytics, FieldChart } from '../../entities/dynamic-form-analytics';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormAnalyticsPresenter } from './dynamicform.analytics.presenter';
import { DynamicFormAnalyticsView } from './dynamicform.analytics.view';

@Component({
  selector: 'app-dynamicform-analytics-page',
  standalone: true,
  templateUrl: './dynamicform.analytics.page.html',
  imports: [DatePipe, RouterLink, IconComponent],
  providers: [DynamicFormAnalyticsPresenter],
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .88rem; margin-bottom: 8px; }
    .stat-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
    .stat { flex: 1 1 140px; min-width: 140px; }
    .stat .n { font-size: 1.6rem; font-weight: 800; color: var(--color-text); }
    .stat .l { font-size: .78rem; color: var(--color-muted); }
    .chart-block { margin-bottom: 14px; }
    .chart-block h4 { margin: 0 0 12px; font-size: .95rem; }
    .spark { display: flex; align-items: flex-end; gap: 3px; height: 90px; }
    .spark .bar { flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; min-height: 2px; }
    .hbar { display: grid; grid-template-columns: 160px 1fr 44px; gap: 10px; align-items: center; margin-bottom: 6px; font-size: .84rem; }
    .hbar .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hbar .track { background: var(--color-bg-alt); border-radius: var(--radius-full); height: 16px; overflow: hidden; }
    .hbar .fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
    .hbar .val { text-align: right; color: var(--color-muted); font-weight: 600; }
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
