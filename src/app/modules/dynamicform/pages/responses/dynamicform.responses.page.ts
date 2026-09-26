import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormSubmissionRow } from '../../entities/dynamic-form-submission';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormResponsesPresenter } from './dynamicform.responses.presenter';
import { DynamicFormResponsesView } from './dynamicform.responses.view';

/** Config CmsIndexConfig<DynamicFormSubmissionRow> — Status di sini bukan
 *  enum string (lihat modul Formulir Dinamis sendiri), tapi valid/spam biner,
 *  jadi hanya 2 opsi & dipetakan "1 dicentang = true/false" di presenter.
 *  Backend rekap tidak punya sort dinamis (selalu submittedDate DESC), jadi
 *  semua kolom sortable:false. */
function buildResponsesIndexConfig(): CmsIndexConfig<DynamicFormSubmissionRow> {
  return {
    entityLabel: 'tanggapan',
    statusOptions: [
      { value: 'valid', label: 'Valid' },
      { value: 'spam', label: 'Terindikasi Spam' },
    ],
    searchTargets: [
      { value: 'search', label: 'Nama / Email' },
    ],
    showDateRange: true,
    columns: [
      { key: 'respondentName', label: 'Nama', sortable: false, locked: true },
      { key: 'respondentEmail', label: 'Email', sortable: false },
      { key: 'submittedDate', label: 'Tanggal', sortable: false },
      { key: 'isValid', label: 'Status', sortable: false },
    ],
    defaultSort: { sortBy: 'submittedDate', sortDir: 'desc' },
    rowIdKey: 'submissionID',
    limit: 20,
    emptyIcon: 'clipboard-list',
    emptyTitle: 'Belum ada tanggapan',
    emptyDescription: 'Tanggapan yang masuk lewat tautan publik akan muncul di sini.',
  };
}

@Component({
  selector: 'app-dynamicform-responses-page',
  standalone: true,
  templateUrl: './dynamicform.responses.page.html',
  imports: [DatePipe, RouterLink, IconComponent, CmsIndexComponent],
  providers: [DynamicFormResponsesPresenter],
  styles: [`
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .page-head h1 { margin-bottom: 2px; }
    .table-actions { flex-wrap: nowrap; }
    .page-footer { display: flex; justify-content: flex-end; margin-top: 22px; }
  `],
})
export class DynamicFormResponsesPage implements OnInit, DynamicFormResponsesView {
  private presenter = inject(DynamicFormResponsesPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<DynamicFormSubmissionRow>;

  readonly path = dynamicFormPath;
  formId = Number(this.route.snapshot.paramMap.get('id'));
  form = signal<DynamicForm | null>(null);

  canUpdate = this.auth.hasPermission('dynamicform.update');
  canDelete = this.auth.hasPermission('dynamicform.delete');

  readonly config = buildResponsesIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(this.formId, params);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadForm(this.formId);
  }

  viewSubmission(r: DynamicFormSubmissionRow): void {
    if (!this.canUpdate) return;
    this.router.navigate([this.path.responseEdit(this.formId, r.submissionID)]);
  }

  exportCsv(): void { this.presenter.exportCsv(this.formId); }

  async deleteRow(r: DynamicFormSubmissionRow, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus tanggapan dari ${r.respondentEmail}?`, {
      title: 'Hapus Tanggapan', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.deleteSubmission(this.formId, r.submissionID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(this.formId, ids as number[]); }

  async deleteAll(event?: Event): Promise<void> {
    const ok = await this.alert.confirm('Hapus SEMUA tanggapan formulir ini? Berkas terunggah ikut terhapus permanen.', {
      title: 'Hapus Semua Respons', confirmLabel: 'Ya, Hapus Semua', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.deleteAll(this.formId);
  }

  setForm(form: DynamicForm): void { this.form.set(form); }
  onMutated(): void { this.presenter.loadForm(this.formId); this.table.refresh(); }
}
