import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { SubmissionAnswersViewComponent } from '../../components/submission-answers-view.component';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionResponse, SubmissionDetail, SUBMISSION_STATUS_LABELS } from '../../entities/submission';
import { SubmissionPublikasiPresenter } from './submission.publikasi.presenter';
import { SubmissionPublikasiView } from './submission.publikasi.view';

@Component({
  selector: 'app-submission-publikasi-page',
  standalone: true,
  templateUrl: './submission.publikasi.page.html',
  imports: [FormsModule, IconComponent, SubmissionAnswersViewComponent],
  providers: [SubmissionPublikasiPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .queue-list { display: flex; flex-direction: column; gap: 8px; }
    .queue-row { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; cursor: pointer; text-align: left; }
    .queue-row:hover { border-color: var(--color-primary); }
    .queue-row.active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .action-bar { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 14px; }
    .btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .detail-card-fade { opacity: 0; transform: translateY(6px); transition: opacity .25s ease, transform .25s ease; }
    .detail-card-fade.is-visible { opacity: 1; transform: translateY(0); }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
  `],
})
export class SubmissionPublikasiPage implements OnInit, SubmissionPublikasiView {
  private presenter = inject(SubmissionPublikasiPresenter);
  private alert = inject(AlertService);

  queue = signal<SubmissionResponse[]>([]);
  orgNames = signal<Record<number, string>>({});
  version = signal<FormVersionDetail | null>(null);
  detail = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);
  detailTransitioning = signal(false);
  reopenReason = '';

  readonly statusLabels = SUBMISSION_STATUS_LABELS;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadQueue();
  }

  orgName(id: number): string { return this.orgNames()[id] ?? `Organisasi #${id}`; }
  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  select(item: SubmissionResponse): void {
    this.reopenReason = '';
    this.detailTransitioning.set(true);
    this.presenter.openDetail(item.submissionID);
  }

  async publish(): Promise<void> {
    const d = this.detail();
    if (!d) return;
    const ok = await this.alert.confirm('Publikasikan hasil levelisasi ini? Hasil akan terlihat publik.', { title: 'Publikasikan Hasil', confirmLabel: 'Ya, Publikasikan' });
    if (!ok) return;
    this.presenter.publish(d.submissionID, d.version);
  }

  async reopen(): Promise<void> {
    const d = this.detail();
    if (!d || !this.reopenReason.trim()) return;
    const ok = await this.alert.confirm('Buka kembali submission ini untuk koreksi administratif?', { title: 'Buka Kembali untuk Koreksi', confirmLabel: 'Ya, Buka Kembali' });
    if (!ok) return;
    this.presenter.reopen(d.submissionID, this.reopenReason, d.version);
  }

  async reassess(): Promise<void> {
    const d = this.detail();
    if (!d) return;
    const ok = await this.alert.confirm('Ajukan siklus reassessment baru? LDK akan mengisi ulang form dari awal.', { title: 'Ajukan Reassessment', confirmLabel: 'Ya, Ajukan' });
    if (!ok) return;
    this.presenter.reassess(d.submissionID, d.version);
  }

  setQueue(items: SubmissionResponse[]): void { this.queue.set(items); }
  setOrgNames(names: Record<number, string>): void { this.orgNames.set(names); }
  setVersion(version: FormVersionDetail): void { this.version.set(version); }
  setDetail(detail: SubmissionDetail): void {
    this.detail.set(detail);
    requestAnimationFrame(() => this.detailTransitioning.set(false));
  }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
  onActionSuccess(): void { this.detail.set(null); }
}
