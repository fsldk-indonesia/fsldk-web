import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { SubmissionDetail, FORM_CODE_LEVELISASI, FORM_CODE_SENSUS_KADER } from '../../entities/submission';
import { submissionPath } from '../../submission.path';
import { SubmissionStatusPresenter } from './submission.status.presenter';
import { SubmissionStatusView } from './submission.status.view';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draf', SUBMITTED: 'Terkirim', CANCELLED: 'Dibatalkan', REJECTED: 'Ditolak',
  PUSKOMDA_REVIEW: 'Verifikasi Puskomda', REVISION_REQUESTED_PUSKOMDA: 'Revisi Diminta (Puskomda)',
  APPROVED_PUSKOMDA: 'Disetujui Puskomda', PUSKOMNAS_REVIEW: 'Verifikasi Puskomnas',
  REVISION_REQUESTED_PUSKOMNAS: 'Revisi Diminta (Puskomnas)', LEVEL_ESTABLISHED: 'Level Ditetapkan',
  PUBLISHED: 'Dipublikasikan', LDK_REVIEW: 'Verifikasi LDK', REVISION_REQUESTED_LDK: 'Revisi Diminta (LDK)',
  APPROVED_LDK: 'Disetujui LDK', CODE_ISSUED: 'Kode Terbit', ACTIVE: 'Aktif',
};

@Component({
  selector: 'app-submission-status-page',
  standalone: true,
  templateUrl: './submission.status.page.html',
  imports: [RouterLink, DatePipe, IconComponent],
  providers: [SubmissionStatusPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .status-card { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-radius: var(--radius-md); background: var(--color-primary-soft); margin-bottom: 20px; }
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); margin-top: 6px; flex-shrink: 0; }
    .result-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 18px; margin-top: 16px; }
    .code-display { font-size: 1.4rem; font-weight: 700; letter-spacing: .5px; }
    .section-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fff; padding: 18px; }
  `],
})
export class SubmissionStatusPage implements OnInit, SubmissionStatusView {
  private presenter = inject(SubmissionStatusPresenter);
  private auth = inject(AuthRepository);

  readonly submissionPath = submissionPath;
  readonly statusLabels = STATUS_LABELS;

  formCode = computed(() => (this.auth.user()?.organizationTypeCode === 'LDK' ? FORM_CODE_LEVELISASI : FORM_CODE_SENSUS_KADER));
  isKaderSubject = computed(() => this.formCode() === FORM_CODE_SENSUS_KADER);

  submission = signal<SubmissionDetail | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.formCode());
  }

  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  setSubmission(detail: SubmissionDetail | null): void { this.submission.set(detail); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
}
