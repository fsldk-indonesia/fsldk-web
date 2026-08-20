import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';
import { FORM_CODE_SENSUS_KADER } from './entities/submission';

/**
 * Rute Portal Kader — dipasang sebagai children dari KaderLayoutComponent
 * (miss-development-clarification.md poin 5-6), TERPISAH dari CmsLayoutComponent.
 * `pendataan`/`status` reuse langsung komponen modul submission (sudah
 * mendukung subjek Kader lewat FORM_CODE_SENSUS_KADER — lihat
 * SubmissionPendataanPage.formCode()), hanya dipasang di shell berbeda.
 */
export const kaderRoutes: () => Routes = () => [
  { path: '', pathMatch: 'full', redirectTo: 'ringkasan' },
  {
    path: 'ringkasan',
    canActivate: [verifiedGuard],
    loadComponent: () => import('./pages/kader-ringkasan/submission.kader-ringkasan.page').then((m) => m.SubmissionKaderRingkasanPage),
  },
  {
    path: 'pendataan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.create', formCode: FORM_CODE_SENSUS_KADER },
    loadComponent: () => import('./pages/pendataan/submission.pendataan.page').then((m) => m.SubmissionPendataanPage),
  },
  {
    path: 'status',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.view', formCode: FORM_CODE_SENSUS_KADER },
    loadComponent: () => import('./pages/status/submission.status.page').then((m) => m.SubmissionStatusPage),
  },
  // Profil Saya dipindah keluar dari sini ke rute publik /akun/profil (lihat
  // app.routes.ts) supaya akun non-Kader (CMS staff, yang tidak pernah masuk
  // ke shell ini) juga bisa mengaksesnya — link sidebar di bawah diarahkan
  // ke rute bersama itu, bukan didup dua rute untuk halaman yang sama.
];
