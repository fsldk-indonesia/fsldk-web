import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { SubmissionDetail, SUBMISSION_STATUS_LABELS } from '../../entities/submission';
import { SubmissionKaderRingkasanPresenter } from './submission.kader-ringkasan.presenter';
import { SubmissionKaderRingkasanView } from './submission.kader-ringkasan.view';

@Component({
  selector: 'app-submission-kader-ringkasan-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  providers: [SubmissionKaderRingkasanPresenter],
  template: `
    <div class="page-head">
      <h1>Halo, {{ auth.user()?.fullName }} 👋</h1>
      <p class="text-muted">Ringkasan status kekaderan Anda di FSLDK Indonesia.</p>
    </div>

    @if (loading()) {
      <div class="card card-pad"><span class="skel skel-line" style="width:60%;height:20px"></span></div>
    } @else if (!submission()) {
      <div class="card card-pad">
        <span class="icon-badge lg icon-badge-soft" style="margin-bottom:14px"><app-icon name="clipboard-list" [size]="26" /></span>
        <h3>Anda belum terdaftar sebagai kader</h3>
        <p class="text-muted">Isi Formulir Pendataan Sensus Kader untuk mulai bergabung dengan LDK pilihan Anda.</p>
        <a class="btn btn-primary" style="margin-top:10px" routerLink="/kader/pendataan">Isi Formulir Pendataan</a>
      </div>
    } @else if (isActive()) {
      <div class="card card-pad">
        <span class="badge badge-active" style="margin-bottom:10px">Kader Aktif</span>
        <h3>Selamat, pendaftaran Anda telah disetujui</h3>
        @if (submission()!.kader?.uniqueCode) {
          <p class="text-muted">Kode Kader Anda:</p>
          <p class="code-display">{{ submission()!.kader!.uniqueCode }}</p>
        }
        <a class="btn btn-outline" style="margin-top:10px" routerLink="/kader/status">Lihat Detail Status</a>
      </div>
    } @else {
      <div class="card card-pad">
        <span class="badge badge-draft" style="margin-bottom:10px">{{ statusLabel() }}</span>
        <h3>Pendaftaran Anda sedang diproses</h3>
        <p class="text-muted">LDK tujuan Anda akan memeriksa data yang sudah dikirim. Anda akan melihat perubahan status di sini.</p>
        <a class="btn btn-outline" style="margin-top:10px" routerLink="/kader/status">Lihat Status Pendataan</a>
      </div>
    }
  `,
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .code-display { font-size: 1.4rem; font-weight: 700; letter-spacing: .5px; color: var(--color-primary-dark); }
  `],
})
export class SubmissionKaderRingkasanPage implements OnInit, SubmissionKaderRingkasanView {
  private presenter = inject(SubmissionKaderRingkasanPresenter);
  auth = inject(AuthRepository);

  submission = signal<SubmissionDetail | null>(null);
  loading = signal(true);

  isActive = computed(() => this.submission()?.status === 'ACTIVE');
  statusLabel = computed(() => {
    const s = this.submission();
    if (!s) return '';
    return SUBMISSION_STATUS_LABELS[s.status] ?? s.status;
  });

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  setSubmission(detail: SubmissionDetail | null): void { this.submission.set(detail); }
  setLoading(loading: boolean): void { this.loading.set(loading); }
}
