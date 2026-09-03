import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute publik Kantong Amal — dipasang sebagai children dari PublicLayoutComponent. */
export const kantongAmalPublicRoutes: () => Routes = () => [
  {
    path: 'kantong-amal',
    loadComponent: () => import('./pages/campaign-list/kantong-amal.campaign-list.page').then((m) => m.KantongAmalCampaignListPage),
  },
  {
    path: 'kantong-amal/donasi/:publicRef/status',
    loadComponent: () => import('./pages/payment-status/kantong-amal.payment-status.page').then((m) => m.KantongAmalPaymentStatusPage),
  },
  {
    path: 'kantong-amal/donasi/:publicRef/bukti',
    loadComponent: () => import('./pages/donation-receipt/kantong-amal.donation-receipt.page').then((m) => m.KantongAmalDonationReceiptPage),
  },
  {
    path: 'kantong-amal/:slug/donasi',
    loadComponent: () => import('./pages/donate/kantong-amal.donate.page').then((m) => m.KantongAmalDonatePage),
  },
  {
    path: 'kantong-amal/:slug',
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
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.view' },
    loadComponent: () => import('./pages/admin-campaign/kantong-amal.admin-campaign.page').then((m) => m.KantongAmalAdminCampaignPage),
  },
  {
    path: 'kantong-amal/campaigns/baru',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    loadComponent: () => import('./pages/campaign-form/kantong-amal.campaign-form.page').then((m) => m.KantongAmalCampaignFormPage),
  },
  {
    path: 'kantong-amal/campaigns/:id/edit',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.update' },
    loadComponent: () => import('./pages/campaign-form/kantong-amal.campaign-form.page').then((m) => m.KantongAmalCampaignFormPage),
  },
  {
    path: 'kantong-amal/donasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.donation.view' },
    loadComponent: () => import('./pages/admin-donation-monitoring/kantong-amal.admin-donation-monitoring.page').then((m) => m.KantongAmalAdminDonationMonitoringPage),
  },
  {
    path: 'kantong-amal/donasi/baru',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.donation.create' },
    loadComponent: () => import('./pages/admin-donation-form/kantong-amal.admin-donation-form.page').then((m) => m.KantongAmalAdminDonationFormPage),
  },
  {
    path: 'kantong-amal/donasi/:id/edit',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.donation.update' },
    loadComponent: () => import('./pages/admin-donation-form/kantong-amal.admin-donation-form.page').then((m) => m.KantongAmalAdminDonationFormPage),
  },
  {
    path: 'kantong-amal/penarikan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.approve' },
    loadComponent: () => import('./pages/admin-withdrawal/kantong-amal.admin-withdrawal.page').then((m) => m.KantongAmalAdminWithdrawalPage),
  },
  {
    path: 'kantong-amal/penarikan/baru',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.request' },
    loadComponent: () => import('./pages/withdrawal-form/kantong-amal.withdrawal-form.page').then((m) => m.KantongAmalWithdrawalFormPage),
  },
  {
    path: 'kantong-amal/penarikan/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.approve' },
    loadComponent: () => import('./pages/withdrawal-detail/kantong-amal.withdrawal-detail.page').then((m) => m.KantongAmalWithdrawalDetailPage),
  },
  {
    path: 'kantong-amal/laporan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.report.view' },
    loadComponent: () => import('./pages/admin-reports/kantong-amal.admin-reports.page').then((m) => m.KantongAmalAdminReportsPage),
  },
  {
    path: 'kantong-amal/laporan/rekonsiliasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.report.view' },
    loadComponent: () => import('./pages/admin-reconciliation/kantong-amal.admin-reconciliation.page').then((m) => m.KantongAmalAdminReconciliationPage),
  },
  {
    path: 'kantong-amal/audit-log',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.audit.view' },
    loadComponent: () => import('./pages/admin-audit-log/kantong-amal.admin-audit-log.page').then((m) => m.KantongAmalAdminAuditLogPage),
  },
];
