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
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .88rem; margin-bottom: 8px; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .page-head h1 { margin-bottom: 2px; }
    .toolbar { flex-wrap: wrap; }
    .toolbar .form-control { max-width: 260px; }
    .check-inline { display: inline-flex; align-items: center; gap: 8px; font-size: .88rem; color: var(--color-text); }
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
