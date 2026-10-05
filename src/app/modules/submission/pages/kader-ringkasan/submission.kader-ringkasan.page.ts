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
      <div class="status-card status-tone-neutral">
        <span class="icon-badge lg icon-badge-soft"><app-icon name="clipboard-list" [size]="26" /></span>
        <h3>Anda belum terdaftar sebagai kader</h3>
        <p class="text-muted">Isi Formulir Pendataan Sensus Kader untuk mulai bergabung dengan LDK pilihan Anda.</p>
        <a class="btn btn-primary" routerLink="/kader/pendataan">Isi Formulir Pendataan</a>
      </div>
    } @else if (isActive()) {
      <div class="status-card status-tone-active">
        <span class="icon-badge lg icon-badge-solid"><app-icon name="check-circle" [size]="26" /></span>
        <span class="badge badge-active">Kader Aktif</span>
        <h3>Selamat, pendaftaran Anda telah disetujui</h3>
        @if (submission()!.kader?.uniqueCode) {
          <p class="text-muted" style="margin-bottom:-2px">Kode Kader Anda</p>
          <span class="kader-code-badge">{{ submission()!.kader!.uniqueCode }}</span>
        }
        <a class="btn btn-outline" routerLink="/kader/status">Lihat Detail Status</a>
      </div>
    } @else if (isRejected()) {
      <div class="status-card status-tone-danger">
        <span class="icon-badge lg icon-badge-danger"><app-icon name="x-circle" [size]="26" /></span>
        <span class="badge badge-rejected">Ditolak</span>
        <h3>Pendaftaran Anda ditolak LDK</h3>
        <p class="text-muted">Hubungi LDK tujuan Anda bila ingin didaftarkan ulang — LDK dapat memutihkan kembali data Anda untuk mendaftar dari awal.</p>
        <a class="btn btn-outline" routerLink="/kader/status">Lihat Detail Status</a>
      </div>
    } @else if (isRevision()) {
      <div class="status-card status-tone-warning">
        <span class="icon-badge lg icon-badge-ember"><app-icon name="alert-triangle" [size]="26" /></span>
        <span class="badge badge-revision">Perlu Revisi</span>
        <h3>LDK meminta Anda melengkapi/memperbaiki data</h3>
        <p class="text-muted">Silakan buka Formulir Pendataan untuk memperbaiki jawaban Anda, lalu kirim ulang.</p>
        <a class="btn btn-primary" routerLink="/kader/pendataan">Lengkapi Formulir Pendataan</a>
      </div>
    } @else {
      <div class="status-card status-tone-pending">
        <span class="icon-badge lg icon-badge-soft"><app-icon name="clock" [size]="26" /></span>
        <span class="badge badge-draft">{{ statusLabel() }}</span>
        <h3>Pendaftaran Anda sedang diproses</h3>
        <p class="text-muted">LDK tujuan Anda akan memeriksa data yang sudah dikirim. Anda akan melihat perubahan status di sini.</p>
        <a class="btn btn-outline" routerLink="/kader/status">Lihat Status Pendataan</a>
      </div>
    }
  `,
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }

    /* Kartu status SENGAJA bukan .card (lihat kader-layout.component.ts:
       .kader-page-shell meratakan ".page-head + .card" supaya Pendataan/
       Status yang dipakai bersama CMS tidak jadi card-di-dalam-card — kalau
       kartu status di sini pakai class .card juga, warnanya bakal ikut
       diratakan jadi transparan oleh rule yang sama). Styling kartu ditulis
       sendiri di bawah supaya tone warna per status tetap terlihat penuh. */
    .status-card {
      text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 40px 28px; border-radius: var(--radius-lg); border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }
    .status-card .icon-badge { margin-bottom: 4px; }
    .status-card h3 { margin: 0; }
    .status-card p.text-muted { max-width: 440px; margin: 0; }
    .status-card .btn { margin-top: 10px; }
    .status-tone-neutral { background: linear-gradient(160deg, #fff, var(--color-bg-alt)); }
    .status-tone-active { background: linear-gradient(160deg, #fff, var(--color-primary-soft)); }
    .status-tone-danger { background: linear-gradient(160deg, #fff, var(--color-danger-soft)); border-color: transparent; }
    .status-tone-warning { background: linear-gradient(160deg, #fff, var(--color-ember-soft)); border-color: transparent; }
    .status-tone-pending { background: linear-gradient(160deg, #fff, var(--color-bg-warm)); }

    .kader-code-badge {
      font-family: var(--font-heading); font-weight: 800; font-size: 1.3rem; letter-spacing: .06em;
      background: var(--color-primary-soft); color: var(--color-primary-dark); padding: 8px 22px;
      border-radius: var(--radius-full);
    }
    .badge-rejected { background: #f6c9c9; color: #9a1c1c; }
    .badge-revision { background: var(--color-ember-soft); color: var(--color-ember-dark); }
  `],
})
export class SubmissionKaderRingkasanPage implements OnInit, SubmissionKaderRingkasanView {
  private presenter = inject(SubmissionKaderRingkasanPresenter);
  auth = inject(AuthRepository);

  submission = signal<SubmissionDetail | null>(null);
  loading = signal(true);

  isActive = computed(() => this.submission()?.status === 'ACTIVE');
  isRejected = computed(() => this.submission()?.status === 'REJECTED');
  isRevision = computed(() => this.submission()?.status === 'REVISION_REQUESTED_LDK');
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
