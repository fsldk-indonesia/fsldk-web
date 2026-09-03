import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormSubmissionRow } from '../../entities/dynamic-form-submission';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormResponsesPresenter } from './dynamicform.responses.presenter';
import { DynamicFormResponsesView } from './dynamicform.responses.view';

@Component({
  selector: 'app-dynamicform-responses-page',
  standalone: true,
  templateUrl: './dynamicform.responses.page.html',
  imports: [DatePipe, RouterLink, FormsModule, IconComponent, PaginationComponent],
  providers: [DynamicFormResponsesPresenter],
  styles: [`
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--color-border); font-size: .88rem; }
    .badge { padding: 2px 9px; border-radius: 999px; font-size: .7rem; font-weight: 600; }
    .badge-ok { background: #e1f5e9; color: #00712e; } .badge-bad { background: #fdecec; color: #b42318; }
    .muted { color: var(--color-text-secondary); font-size: .82rem; }
    .row-actions a { margin-right: 10px; }
  `],
})
export class DynamicFormResponsesPage implements OnInit, DynamicFormResponsesView {
  private presenter = inject(DynamicFormResponsesPresenter);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  readonly path = dynamicFormPath;
  formId = Number(this.route.snapshot.paramMap.get('id'));
  form = signal<DynamicForm | null>(null);
  rows = signal<DynamicFormSubmissionRow[]>([]);
  loading = signal(true);
  search = '';
  validOnly = false;
  page = signal(1);
  count = signal(0);
  readonly limit = 20;

  canUpdate = this.auth.hasPermission('dynamicform.update');
  canDelete = this.auth.hasPermission('dynamicform.delete');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadForm(this.formId);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.presenter.load(this.formId, this.page(), this.limit, this.search, this.validOnly);
  }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  exportCsv(): void { this.presenter.exportCsv(this.formId); }

  async deleteRow(r: DynamicFormSubmissionRow, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus tanggapan dari ${r.respondentEmail}?`, {
      title: 'Hapus Tanggapan', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.deleteSubmission(this.formId, r.submissionID);
  }

  async deleteAll(event?: Event): Promise<void> {
    const ok = await this.alert.confirm('Hapus SEMUA tanggapan formulir ini? Berkas terunggah ikut terhapus permanen.', {
      title: 'Hapus Semua Respons', confirmLabel: 'Ya, Hapus Semua', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.deleteAll(this.formId);
  }

  setForm(form: DynamicForm): void { this.form.set(form); }
  setSubmissions(rows: DynamicFormSubmissionRow[], count: number): void { this.rows.set(rows); this.count.set(count); this.loading.set(false); }
  onMutated(): void { this.presenter.loadForm(this.formId); this.load(); }
}
