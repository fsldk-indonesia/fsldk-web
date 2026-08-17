import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../../core/services/alert.service';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { SubmissionAnswersViewComponent } from '../../components/submission-answers-view.component';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { KaderInfo, SubmissionDetail, ReviewDecision } from '../../entities/submission';
import { SubmissionKaderPersetujuanPresenter } from './submission.kader-persetujuan.presenter';
import { SubmissionKaderPersetujuanView } from './submission.kader-persetujuan.view';

const DECISION_OPTIONS: SelectOption[] = [
  { value: 'APPROVED', label: 'Setujui' },
  { value: 'REVISION_REQUESTED', label: 'Minta Revisi' },
  { value: 'REJECTED', label: 'Tolak' },
];

@Component({
  selector: 'app-submission-kader-persetujuan-page',
  standalone: true,
  templateUrl: './submission.kader-persetujuan.page.html',
  imports: [FormsModule, SelectComponent, SubmissionAnswersViewComponent],
  providers: [SubmissionKaderPersetujuanPresenter],
  styles: [`
    .page-head { margin-bottom: 20px; } .page-head h1 { margin-bottom: 2px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .tab-btn { padding: 10px 18px; border-radius: var(--radius-xs); border: 1px solid var(--color-border); background: #fff; cursor: pointer; font-weight: 600; font-size: .9rem; }
    .tab-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .queue-list { display: flex; flex-direction: column; gap: 8px; }
    .queue-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; cursor: pointer; text-align: left; }
    .queue-row:hover { border-color: var(--color-primary); }
    .queue-row.active-row { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .active-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; margin-bottom: 8px; }
    .detail-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 20px; }
    .decision-form { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 14px; }
  `],
})
export class SubmissionKaderPersetujuanPage implements OnInit, SubmissionKaderPersetujuanView {
  private presenter = inject(SubmissionKaderPersetujuanPresenter);
  private alert = inject(AlertService);

  tab = signal<'pending' | 'active'>('pending');
  pending = signal<KaderInfo[]>([]);
  active = signal<KaderInfo[]>([]);
  version = signal<FormVersionDetail | null>(null);
  detail = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);

  decision: ReviewDecision = 'APPROVED';
  note = '';
  decisionOptions = DECISION_OPTIONS;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadAll();
  }

  select(kader: KaderInfo): void {
    this.decision = 'APPROVED';
    this.note = '';
    this.presenter.openDetail(kader.submissionID);
  }

  submitDecision(): void {
    const d = this.detail();
    if (!d) return;
    this.presenter.submitDecision(d.submissionID, { decision: this.decision, note: this.note, version: d.version });
  }

  async deactivate(kader: KaderInfo, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Nonaktifkan kader "${kader.fullName}"?`, {
      title: 'Nonaktifkan Kader', confirmLabel: 'Ya, Nonaktifkan', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.deactivate(kader.kaderID);
  }

  setPending(items: KaderInfo[]): void { this.pending.set(items); }
  setActive(items: KaderInfo[]): void { this.active.set(items); }
  setVersion(version: FormVersionDetail): void { this.version.set(version); }
  setDetail(detail: SubmissionDetail): void { this.detail.set(detail); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  onDecisionSuccess(): void { this.detail.set(null); }
  onDeactivateSuccess(): void {}
}
