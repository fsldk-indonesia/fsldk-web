import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../../core/services/alert.service';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { IconComponent } from '../../../../shared/icon.component';
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
  imports: [FormsModule, SelectComponent, IconComponent, SubmissionAnswersViewComponent],
  providers: [SubmissionKaderPersetujuanPresenter],
  styles: [`
    .page-head { margin-bottom: 20px; } .page-head h1 { margin-bottom: 2px; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); margin-bottom: 20px; flex-wrap: wrap; }
    .tabs button { padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--color-text-secondary); border-bottom: 2px solid transparent; transition: color var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .tabs button:hover { color: var(--color-primary-dark); }
    .tabs button.active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }
    .tab-panel { animation: tab-fade-in .28s ease; }
    @keyframes tab-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    /* min-width:0 — lihat catatan panjang di submission.penetapan-level.page.ts
       (pola/bug identik, halaman ini share komponen scoring-panel yang sama). */
    .layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
    .layout > div { min-width: 0; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .queue-list { display: flex; flex-direction: column; gap: 8px; }
    .queue-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; cursor: pointer; text-align: left; }
    .queue-row:hover { border-color: var(--color-primary); }
    .queue-row.active-row { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .active-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; margin-bottom: 8px; }
    .decision-form { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 14px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .empty-state-inline { padding: 36px 20px 24px; }
    .detail-card-fade { opacity: 0; transform: translateY(6px); transition: opacity .25s ease, transform .25s ease; }
    .detail-card-fade.is-visible { opacity: 1; transform: translateY(0); }
    @media (prefers-reduced-motion: reduce) { .detail-card-fade { opacity: 1; transform: none; transition: none; } }
  `],
})
export class SubmissionKaderPersetujuanPage implements OnInit, SubmissionKaderPersetujuanView {
  private presenter = inject(SubmissionKaderPersetujuanPresenter);
  private alert = inject(AlertService);

  tab = signal<'pending' | 'active' | 'rejected'>('pending');
  pending = signal<KaderInfo[]>([]);
  active = signal<KaderInfo[]>([]);
  rejected = signal<KaderInfo[]>([]);
  version = signal<FormVersionDetail | null>(null);
  detail = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);
  detailTransitioning = signal(false);

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
    this.detailTransitioning.set(true);
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

  async reinstate(kader: KaderInfo, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(
      `Putihkan kembali "${kader.fullName}"? Data akan direset ke Draf agar bisa mendaftar ulang dari awal.`,
      { title: 'Putihkan Kembali', confirmLabel: 'Ya, Putihkan' }, event,
    );
    if (!ok) return;
    this.presenter.reinstate(kader.kaderID);
  }

  setPending(items: KaderInfo[]): void { this.pending.set(items); }
  setActive(items: KaderInfo[]): void { this.active.set(items); }
  setRejected(items: KaderInfo[]): void { this.rejected.set(items); }
  setVersion(version: FormVersionDetail): void { this.version.set(version); }
  setDetail(detail: SubmissionDetail): void {
    this.detail.set(detail);
    requestAnimationFrame(() => this.detailTransitioning.set(false));
  }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  onDecisionSuccess(): void { this.detail.set(null); }
  onDeactivateSuccess(): void {}
  onReinstateSuccess(): void {}
}
