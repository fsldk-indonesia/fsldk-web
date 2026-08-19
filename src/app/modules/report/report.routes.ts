import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute laporan Levelisasi — dipasang sebagai children dari CmsLayoutComponent.
 *  Satu halaman dipakai untuk kedua rute (cakupan datanya sudah otomatis
 *  disaring backend sesuai organisasi caller — Puskomda "wilayah", Puskomnas
 *  "nasional" — sesuai DL-11, Sensus Kader tidak pernah termasuk di sini. */
export const reportRoutes: () => Routes = () => [
  {
    path: 'reports/wilayah',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'report.region.view', title: 'Laporan Wilayah', exportPermission: 'report.region.export' },
    loadComponent: () => import('./pages/report-list/report.list.page').then((m) => m.ReportListPage),
  },
  {
    path: 'reports/nasional',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'report.national.view', title: 'Laporan Nasional', exportPermission: 'report.national.export' },
    loadComponent: () => import('./pages/report-list/report.list.page').then((m) => m.ReportListPage),
  },
];
