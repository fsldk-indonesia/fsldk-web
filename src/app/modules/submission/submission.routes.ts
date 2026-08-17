import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute pengisian & status pendataan — dipasang sebagai children dari CmsLayoutComponent. */
export const submissionRoutes: () => Routes = () => [
  {
    path: 'submissions/pendataan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.create' },
    loadComponent: () => import('./pages/pendataan/submission.pendataan.page').then((m) => m.SubmissionPendataanPage),
  },
  {
    path: 'submissions/status',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.view' },
    loadComponent: () => import('./pages/status/submission.status.page').then((m) => m.SubmissionStatusPage),
  },
  {
    path: 'kaders/persetujuan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.review.ldk' },
    loadComponent: () => import('./pages/kader-persetujuan/submission.kader-persetujuan.page').then((m) => m.SubmissionKaderPersetujuanPage),
  },
  {
    path: 'submissions/verifikasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: {
      permission: 'submission.review.tier1', reviewTier: 'PUSKOMDA', statuses: ['SUBMITTED', 'PUSKOMDA_REVIEW'],
      title: 'Verifikasi Wilayah', canApprove: false,
    },
    loadComponent: () => import('./pages/review-queue/submission.review-queue.page').then((m) => m.SubmissionReviewQueuePage),
  },
  {
    path: 'submissions/persetujuan',
    canActivate: [verifiedGuard, permissionGuard],
    data: {
      permission: 'submission.approve.tier1', reviewTier: 'PUSKOMDA', statuses: ['SUBMITTED', 'PUSKOMDA_REVIEW'],
      title: 'Persetujuan Wilayah', canApprove: true,
    },
    loadComponent: () => import('./pages/review-queue/submission.review-queue.page').then((m) => m.SubmissionReviewQueuePage),
  },
  {
    path: 'submissions/verifikasi-akhir',
    canActivate: [verifiedGuard, permissionGuard],
    data: {
      permission: 'submission.review.tier2', reviewTier: 'PUSKOMNAS', statuses: ['APPROVED_PUSKOMDA', 'PUSKOMNAS_REVIEW'],
      title: 'Verifikasi Akhir Nasional', canApprove: false,
    },
    loadComponent: () => import('./pages/review-queue/submission.review-queue.page').then((m) => m.SubmissionReviewQueuePage),
  },
  {
    path: 'submissions/penetapan-level',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.level.establish' },
    loadComponent: () => import('./pages/penetapan-level/submission.penetapan-level.page').then((m) => m.SubmissionPenetapanLevelPage),
  },
  {
    path: 'submissions/publikasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.publish' },
    loadComponent: () => import('./pages/publikasi/submission.publikasi.page').then((m) => m.SubmissionPublikasiPage),
  },
];
