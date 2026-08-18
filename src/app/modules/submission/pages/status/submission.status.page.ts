import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { SubmissionDetail, FORM_CODE_LEVELISASI, FORM_CODE_SENSUS_KADER, SUBMISSION_STATUS_LABELS } from '../../entities/submission';
import { SubmissionStatusPresenter } from './submission.status.presenter';
import { SubmissionStatusView } from './submission.status.view';

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
  private route = inject(ActivatedRoute);
  private alert = inject(AlertService);

  readonly statusLabels = SUBMISSION_STATUS_LABELS;

  /** Lihat catatan di submission.pendataan.page.ts — formCode datang dari
   *  route data (shell), bukan tier akun pemanggil. */
  formCode = computed(() => (this.route.snapshot.data['formCode'] as string | undefined) ?? FORM_CODE_LEVELISASI);
  isKaderSubject = computed(() => this.formCode() === FORM_CODE_SENSUS_KADER);
  canReassess = this.auth.hasPermission('submission.reassess');

  submission = signal<SubmissionDetail | null>(null);
  loading = signal(true);
  busy = signal(false);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load(this.formCode());
  }

  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  async reassess(event?: Event): Promise<void> {
    const s = this.submission();
    if (!s) return;
    const ok = await this.alert.confirm('Ajukan siklus reassessment baru? Anda akan mengisi ulang form Levelisasi dari awal.', {
      title: 'Ajukan Reassessment', confirmLabel: 'Ya, Ajukan',
    }, event);
    if (!ok) return;
    this.presenter.reassess(s.submissionID, s.version);
  }

  setSubmission(detail: SubmissionDetail | null): void { this.submission.set(detail); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setBusy(busy: boolean): void { this.busy.set(busy); }
}
