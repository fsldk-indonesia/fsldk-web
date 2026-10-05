import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute publik Kantong Amal — dipasang sebagai children dari PublicLayoutComponent. */
export const kantongAmalPublicRoutes: () => Routes = () => [
  {
    path: 'kantong-amal',
    title: 'Kantong Amal',
    loadComponent: () => import('./pages/campaign-list/kantong-amal.campaign-list.page').then((m) => m.KantongAmalCampaignListPage),
  },
  {
    path: 'kantong-amal/donasi/:publicRef/status',
    title: 'Status Donasi',
    loadComponent: () => import('./pages/payment-status/kantong-amal.payment-status.page').then((m) => m.KantongAmalPaymentStatusPage),
  },
  {
    path: 'kantong-amal/donasi/:publicRef/bukti',
    title: 'Bukti Donasi',
    loadComponent: () => import('./pages/donation-receipt/kantong-amal.donation-receipt.page').then((m) => m.KantongAmalDonationReceiptPage),
  },
  {
    path: 'kantong-amal/:slug/donasi',
    title: 'Donasi',
    loadComponent: () => import('./pages/donate/kantong-amal.donate.page').then((m) => m.KantongAmalDonatePage),
  },
  {
    path: 'kantong-amal/:slug',
    title: 'Detail Campaign',
    loadComponent: () => import('./pages/campaign-detail/kantong-amal.campaign-detail.page').then((m) => m.KantongAmalCampaignDetailPage),
  },
];

/**
 * Rute admin CMS Kantong Amal — dipasang sebagai children CmsLayoutComponent
 * (§8.4 techspec). Revisi 2026-09-01: campaign/donation/withdrawal murni
 * CRUD/aksi permission-gated, TIDAK ada lagi rute milik-sendiri
 * ("campaigns-saya/...", dulu `kantongAmalMeRoutes` — dihapus seluruhnya,
 * termasuk halaman balance/ledger-history/withdrawal-history self-service
 * yang kini digantikan Laporan Kantong Amal).
 */
export const kantongAmalAdminRoutes: () => Routes = () => [
  {
    path: 'kantong-amal/campaigns',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.campaign.view' },
    title: 'Campaign',
    loadComponent: () => import('./pages/admin-campaign/kantong-amal.admin-campaign.page').then((m) => m.KantongAmalAdminCampaignPage),
  },
  {
    path: 'kantong-amal/campaigns/baru',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    title: 'Tambah Campaign',
    loadComponent: () => import('./pages/campaign-form/kantong-amal.campaign-form.page').then((m) => m.KantongAmalCampaignFormPage),
  },
  {
    path: 'kantong-amal/campaigns/:id/edit',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.campaign.update' },
    title: 'Edit Campaign',
    loadComponent: () => import('./pages/campaign-form/kantong-amal.campaign-form.page').then((m) => m.KantongAmalCampaignFormPage),
  },
  {
    // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
    // lewat route data `viewOnly` yang membuat semua field disabled dan
    // tombol Simpan disembunyikan, sama pola dengan Berita/Formulir Dinamis.
    path: 'kantong-amal/campaigns/:id/view',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.campaign.view', viewOnly: true },
    title: 'Detail Campaign',
    loadComponent: () => import('./pages/campaign-form/kantong-amal.campaign-form.page').then((m) => m.KantongAmalCampaignFormPage),
  },
  {
    path: 'kantong-amal/donasi',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.donation.view' },
    title: 'Donasi',
    loadComponent: () => import('./pages/admin-donation-monitoring/kantong-amal.admin-donation-monitoring.page').then((m) => m.KantongAmalAdminDonationMonitoringPage),
  },
  {
    path: 'kantong-amal/donasi/baru',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.donation.create' },
    title: 'Tambah Donasi',
    loadComponent: () => import('./pages/admin-donation-form/kantong-amal.admin-donation-form.page').then((m) => m.KantongAmalAdminDonationFormPage),
  },
  {
    path: 'kantong-amal/donasi/:id/edit',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.donation.update' },
    title: 'Edit Donasi',
    loadComponent: () => import('./pages/admin-donation-form/kantong-amal.admin-donation-form.page').then((m) => m.KantongAmalAdminDonationFormPage),
  },
  {
    // Donasi dari gateway (bisatopup) tidak bisa diedit — hanya dilihat.
    // Komponen sama dengan form, dibedakan lewat route data `viewOnly`.
    path: 'kantong-amal/donasi/:id/view',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.donation.view', viewOnly: true },
    title: 'Detail Donasi',
    loadComponent: () => import('./pages/admin-donation-form/kantong-amal.admin-donation-form.page').then((m) => m.KantongAmalAdminDonationFormPage),
  },
  {
    path: 'kantong-amal/penarikan',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.approve' },
    title: 'Penarikan',
    loadComponent: () => import('./pages/admin-withdrawal/kantong-amal.admin-withdrawal.page').then((m) => m.KantongAmalAdminWithdrawalPage),
  },
  {
    path: 'kantong-amal/penarikan/baru',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.request' },
    title: 'Tambah Penarikan',
    loadComponent: () => import('./pages/withdrawal-form/kantong-amal.withdrawal-form.page').then((m) => m.KantongAmalWithdrawalFormPage),
  },
  {
    path: 'kantong-amal/penarikan/:id',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.approve' },
    title: 'Detail Penarikan',
    loadComponent: () => import('./pages/withdrawal-detail/kantong-amal.withdrawal-detail.page').then((m) => m.KantongAmalWithdrawalDetailPage),
  },
  {
    path: 'kantong-amal/laporan',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.report.view' },
    title: 'Laporan Kantong Amal',
    loadComponent: () => import('./pages/admin-reports/kantong-amal.admin-reports.page').then((m) => m.KantongAmalAdminReportsPage),
  },
  {
    path: 'kantong-amal/audit-log',
    canActivate: [permissionGuard],
    data: { permission: 'kantong_amal.audit.view' },
    title: 'Audit Log',
    loadComponent: () => import('./pages/admin-audit-log/kantong-amal.admin-audit-log.page').then((m) => m.KantongAmalAdminAuditLogPage),
  },
];
