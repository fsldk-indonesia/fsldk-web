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
    .cards { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
    .card { border: 1px solid var(--color-border); border-radius: 10px; padding: 16px 20px; min-width: 140px; }
    .card .n { font-size: 1.6rem; font-weight: 700; }
    .card .l { font-size: .78rem; color: var(--color-text-secondary); }
    .spark { display: flex; align-items: flex-end; gap: 3px; height: 90px; margin-bottom: 6px; }
    .spark .bar { flex: 1; background: var(--color-primary, #00933b); border-radius: 2px 2px 0 0; min-height: 2px; }
    .chart-block { border: 1px solid var(--color-border); border-radius: 10px; padding: 16px 18px; margin-bottom: 14px; }
    .chart-block h4 { margin: 0 0 10px; font-size: .95rem; }
    .hbar { display: grid; grid-template-columns: 160px 1fr 40px; gap: 8px; align-items: center; margin-bottom: 5px; font-size: .82rem; }
    .hbar .track { background: var(--color-surface-2, #eef0ee); border-radius: 4px; height: 16px; overflow: hidden; }
    .hbar .fill { height: 100%; background: var(--color-primary, #00933b); }
    .muted { color: var(--color-text-secondary); font-size: .82rem; }
    table { width: 100%; border-collapse: collapse; } th, td { text-align:left; padding: 7px 10px; border-bottom: 1px solid var(--color-border); font-size: .84rem; }
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
