import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute laporan — hub + halaman detail per tier, dibuka dari card di tab
 *  browser baru (TechSpec-Report-Revamp.md DL-1). Cakupan datanya otomatis
 *  disaring backend sesuai organisasi caller. Tiga tier: cms-puskomda/
 *  cms-puskomnas (Laporan Levelisasi + Pendataan + Sensus Kader + Pendataan
 *  Sensus Kader, 4 card di hub) dan cms-ldk (HANYA Sensus Kader + Pendataan
 *  Sensus Kader, 2 card — Portal LDK tidak pernah punya akses Levelisasi,
 *  2026-10-24-sensus-kader-report-design.md D2). */
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
  {
    path: 'reports/sensus-kader',
    canActivate: [permissionGuard],
    data: { permission: 'report.region.view', title: 'Laporan Sensus Kader', exportPermission: 'report.region.export' },
    title: 'Laporan Sensus Kader',
    loadComponent: () => import('./pages/report-sensus-kader/report.sensus-kader.page').then((m) => m.ReportSensusKaderPage),
  },
  {
    path: 'reports/sensus-kader/pendataan',
    canActivate: [permissionGuard],
    data: { permission: 'report.region.view', title: 'Laporan Pendataan Sensus Kader', exportPermission: 'report.region.export' },
    title: 'Laporan Pendataan Sensus Kader',
    loadComponent: () => import('./pages/report-pendataan-sensus-kader/report.pendataan-sensus-kader.page').then((m) => m.ReportPendataanSensusKaderPage),
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
  {
    path: 'reports/sensus-kader',
    canActivate: [permissionGuard],
    data: { permission: 'report.national.view', title: 'Laporan Sensus Kader', exportPermission: 'report.national.export' },
    title: 'Laporan Sensus Kader',
    loadComponent: () => import('./pages/report-sensus-kader/report.sensus-kader.page').then((m) => m.ReportSensusKaderPage),
  },
  {
    path: 'reports/sensus-kader/pendataan',
    canActivate: [permissionGuard],
    data: { permission: 'report.national.view', title: 'Laporan Pendataan Sensus Kader', exportPermission: 'report.national.export' },
    title: 'Laporan Pendataan Sensus Kader',
    loadComponent: () => import('./pages/report-pendataan-sensus-kader/report.pendataan-sensus-kader.page').then((m) => m.ReportPendataanSensusKaderPage),
  },
];

/** Portal LDK — report route PERTAMA yang pernah dimiliki tier ini. Hanya
 *  Sensus Kader (D2) — tidak ada entri 'reports/levelisasi'/'reports/pendataan'
 *  sama sekali, beda dari 2 factory di atas. */
export const reportLdkRoutes: () => Routes = () => [
  {
    path: 'reports',
    canActivate: [permissionGuard],
    data: { permission: 'report.ldk.view', title: 'Laporan' },
    title: 'Laporan',
    loadComponent: () => import('./pages/report-hub/report-hub.page').then((m) => m.ReportHubPage),
  },
  {
    path: 'reports/sensus-kader',
    canActivate: [permissionGuard],
    data: { permission: 'report.ldk.view', title: 'Laporan Sensus Kader', exportPermission: 'report.ldk.export' },
    title: 'Laporan Sensus Kader',
    loadComponent: () => import('./pages/report-sensus-kader/report.sensus-kader.page').then((m) => m.ReportSensusKaderPage),
  },
  {
    path: 'reports/sensus-kader/pendataan',
    canActivate: [permissionGuard],
    data: { permission: 'report.ldk.view', title: 'Laporan Pendataan Sensus Kader', exportPermission: 'report.ldk.export' },
    title: 'Laporan Pendataan Sensus Kader',
    loadComponent: () => import('./pages/report-pendataan-sensus-kader/report.pendataan-sensus-kader.page').then((m) => m.ReportPendataanSensusKaderPage),
  },
];
