import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';
import { FORM_CODE_LEVELISASI } from './entities/submission';

/** Rute pengisian & status pendataan — dipasang sebagai children dari CmsLayoutComponent
 *  (khusus shell cms-ldk). formCode dikunci ke Levelisasi LDK lewat route `data` — halaman
 *  ini SELALU form Levelisasi di sini, terlepas dari tier akun pemanggil (lihat
 *  submission.pendataan.page.ts). */
export const submissionRoutes: () => Routes = () => [
  {
    path: 'submissions/pendataan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.create', formCode: FORM_CODE_LEVELISASI },
    title: 'Pendataan',
    loadComponent: () => import('./pages/pendataan/submission.pendataan.page').then((m) => m.SubmissionPendataanPage),
  },
  {
    path: 'submissions/status',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.view', formCode: FORM_CODE_LEVELISASI },
    title: 'Status Pendataan',
    loadComponent: () => import('./pages/status/submission.status.page').then((m) => m.SubmissionStatusPage),
  },
  {
    path: 'kaders/persetujuan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.review.ldk' },
    title: 'Persetujuan Kader',
    loadComponent: () => import('./pages/kader-persetujuan/submission.kader-persetujuan.page').then((m) => m.SubmissionKaderPersetujuanPage),
  },
  {
    // Verifikasi & Persetujuan Wilayah digabung jadi satu menu (sebelumnya 2
    // menu terpisah "Verifikasi Wilayah"/"Persetujuan Wilayah" yang memuat
    // antrean & keputusan PERSIS SAMA, cuma beda tombol Setujui tersedia atau
    // tidak) — TechSpec DL-06/OQ-04 menegaskan verifikasi & persetujuan
    // tier Puskomda menyatu dalam satu keputusan oleh satu role, bukan 2
    // tahap berurutan (miss-development-prompt-2.md poin 8).
    path: 'submissions/verifikasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: {
      permission: 'submission.approve.tier1', reviewTier: 'PUSKOMDA', statuses: ['SUBMITTED', 'PUSKOMDA_REVIEW'],
      title: 'Verifikasi & Persetujuan Wilayah', canApprove: true,
    },
    title: 'Verifikasi & Persetujuan Wilayah',
    loadComponent: () => import('./pages/review-queue/submission.review-queue.page').then((m) => m.SubmissionReviewQueuePage),
  },
  {
    path: 'submissions/verifikasi-akhir',
    canActivate: [verifiedGuard, permissionGuard],
    data: {
      permission: 'submission.review.tier2', reviewTier: 'PUSKOMNAS', statuses: ['APPROVED_PUSKOMDA', 'PUSKOMNAS_REVIEW'],
      title: 'Verifikasi Akhir Nasional', canApprove: true,
    },
    title: 'Verifikasi Akhir Nasional',
    loadComponent: () => import('./pages/review-queue/submission.review-queue.page').then((m) => m.SubmissionReviewQueuePage),
  },
  {
    path: 'submissions/penetapan-level',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.level.establish' },
    title: 'Penetapan Levelisasi',
    loadComponent: () => import('./pages/penetapan-level/submission.penetapan-level.page').then((m) => m.SubmissionPenetapanLevelPage),
  },
  {
    path: 'submissions/publikasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.publish' },
    title: 'Publikasi Hasil',
    loadComponent: () => import('./pages/publikasi/submission.publikasi.page').then((m) => m.SubmissionPublikasiPage),
  },
];
