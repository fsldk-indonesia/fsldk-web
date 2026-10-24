import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute laporan — hub (2 card) + 2 halaman detail per tier, dibuka dari card
 *  di tab browser baru (TechSpec-Report-Revamp.md DL-1). Cakupan datanya
 *  otomatis disaring backend sesuai organisasi caller (Puskomda "wilayah",
 *  Puskomnas "nasional" — DL-11), Sensus Kader tidak pernah termasuk di sini. */
export const reportRoutes: () => Routes = () => [
  {
    path: 'reports',
    canActivate: [permissionGuard],
    data: { permission: 'report.region.view', title: 'Laporan' },
    title: 'Laporan',
    loadComponent: () => import('./pages/report-hub/report-hub.page').then((m) => m.ReportHubPage),
  },
  {
    path: 'reports/levelisasi',
    canActivate: [permissionGuard],
    data: { permission: 'report.region.view', title: 'Laporan Levelisasi', exportPermission: 'report.region.export' },
    title: 'Laporan Levelisasi',
    loadComponent: () => import('./pages/report-levelisasi/report.levelisasi.page').then((m) => m.ReportLevelisasiPage),
  },
  {
    path: 'reports/pendataan',
    canActivate: [permissionGuard],
    data: { permission: 'report.region.view', title: 'Laporan Pendataan', exportPermission: 'report.region.export' },
    title: 'Laporan Pendataan',
    loadComponent: () => import('./pages/report-pendataan/report.pendataan.page').then((m) => m.ReportPendataanPage),
  },
];

export const reportNasionalRoutes: () => Routes = () => [
  {
    path: 'reports',
    canActivate: [permissionGuard],
    data: { permission: 'report.national.view', title: 'Laporan' },
    title: 'Laporan',
    loadComponent: () => import('./pages/report-hub/report-hub.page').then((m) => m.ReportHubPage),
  },
  {
    path: 'reports/levelisasi',
    canActivate: [permissionGuard],
    data: { permission: 'report.national.view', title: 'Laporan Levelisasi', exportPermission: 'report.national.export' },
    title: 'Laporan Levelisasi',
    loadComponent: () => import('./pages/report-levelisasi/report.levelisasi.page').then((m) => m.ReportLevelisasiPage),
  },
  {
    path: 'reports/pendataan',
    canActivate: [permissionGuard],
    data: { permission: 'report.national.view', title: 'Laporan Pendataan', exportPermission: 'report.national.export' },
    title: 'Laporan Pendataan',
    loadComponent: () => import('./pages/report-pendataan/report.pendataan.page').then((m) => m.ReportPendataanPage),
  },
];
