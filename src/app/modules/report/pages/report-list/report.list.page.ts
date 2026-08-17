import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { SubmissionAnswersViewComponent } from '../../../submission/components/submission-answers-view.component';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionResponse, SubmissionDetail, SUBMISSION_STATUS_LABELS } from '../../../submission/entities/submission';
import { EXPORT_FORMAT_OPTIONS, ExportFormat } from '../../entities/report';
import { ReportListPresenter } from './report.list.presenter';
import { ReportListView } from './report.list.view';

@Component({
  selector: 'app-report-list-page',
  standalone: true,
  templateUrl: './report.list.page.html',
  imports: [FormsModule, SelectComponent, SubmissionAnswersViewComponent],
  providers: [ReportListPresenter],
  styles: [`
    .page-head { margin-bottom: 20px; } .page-head h1 { margin-bottom: 2px; }
    .toolbar { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
    .toolbar .field { min-width: 200px; }
    .toolbar .field .app-select { width: 100%; }
    .table-wrap { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--color-border); font-size: .9rem; }
    th { color: var(--color-text-secondary); font-weight: 600; background: var(--color-bg-warm); }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: var(--color-primary-soft); }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 640px; max-height: 86vh; overflow-y: auto; }
  `],
})
export class ReportListPage implements OnInit, ReportListView {
  private presenter = inject(ReportListPresenter);
  private auth = inject(AuthRepository);
  private route = inject(ActivatedRoute);

  title = this.route.snapshot.data['title'] as string;
  canExport = this.auth.hasPermission(this.route.snapshot.data['exportPermission'] as string);

  rows = signal<SubmissionResponse[]>([]);
  orgNames = signal<Record<number, string>>({});
  version = signal<FormVersionDetail | null>(null);
  detail = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  exporting = signal(false);

  statusFilter: string | null = null;
  exportFormat: ExportFormat = 'xlsx';
  readonly formatOptions = EXPORT_FORMAT_OPTIONS;
  readonly statusLabels = SUBMISSION_STATUS_LABELS;

  statusOptions = computed<SelectOption[]>(() => {
    const codes = [...new Set(this.rows().map((r) => r.status))];
    return codes.map((c) => ({ value: c, label: this.statusLabel(c) }));
  });

  filteredRows = computed(() => {
    const status = this.statusFilter;
    return status ? this.rows().filter((r) => r.status === status) : this.rows();
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadAll();
  }

  orgName(id: number): string { return this.orgNames()[id] ?? `Organisasi #${id}`; }
  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  select(item: SubmissionResponse): void { this.presenter.openDetail(item.submissionID); }
  closeDetail(): void { this.detail.set(null); }

  export(): void { this.presenter.export(this.statusFilter ?? undefined, this.exportFormat); }

  setRows(rows: SubmissionResponse[]): void { this.rows.set(rows); }
  setOrgNames(names: Record<number, string>): void { this.orgNames.set(names); }
  setVersion(version: FormVersionDetail): void { this.version.set(version); }
  setDetail(detail: SubmissionDetail): void { this.detail.set(detail); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setExporting(exporting: boolean): void { this.exporting.set(exporting); }
}
