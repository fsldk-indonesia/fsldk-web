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
 * Rute self-service pemilik campaign — dipasang sebagai children dari
 * CmsLayoutComponent (path `cms/kantong-amal/campaigns-saya/...`, mengikuti
 * §8.3 techspec). Digerbang permission `kantong_amal.campaign.create` (satu
 * permission generik "boleh mengelola campaign sendiri", sama pola dengan
 * modules/campaign backend) — bukan permission per-halaman karena seluruh
 * halaman ini murni self-service, kepemilikan campaign individual tetap
 * divalidasi di backend (404 untuk campaign bukan milik caller).
 */
export const kantongAmalMeRoutes: () => Routes = () => [
  {
    path: 'kantong-amal/campaigns-saya',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    loadComponent: () => import('./pages/my-campaigns/kantong-amal.my-campaigns.page').then((m) => m.KantongAmalMyCampaignsPage),
  },
  {
    path: 'kantong-amal/campaigns-saya/baru',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    loadComponent: () => import('./pages/campaign-form/kantong-amal.campaign-form.page').then((m) => m.KantongAmalCampaignFormPage),
  },
  {
    path: 'kantong-amal/campaigns-saya/:id/edit',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    loadComponent: () => import('./pages/campaign-form/kantong-amal.campaign-form.page').then((m) => m.KantongAmalCampaignFormPage),
  },
  {
    path: 'kantong-amal/campaigns-saya/:id/saldo',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    loadComponent: () => import('./pages/balance/kantong-amal.balance.page').then((m) => m.KantongAmalBalancePage),
  },
  {
    path: 'kantong-amal/campaigns-saya/:id/riwayat',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    loadComponent: () => import('./pages/ledger-history/kantong-amal.ledger-history.page').then((m) => m.KantongAmalLedgerHistoryPage),
  },
  {
    path: 'kantong-amal/campaigns-saya/:id/tarik-saldo',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.request' },
    loadComponent: () => import('./pages/withdrawal-form/kantong-amal.withdrawal-form.page').then((m) => m.KantongAmalWithdrawalFormPage),
  },
  {
    path: 'kantong-amal/campaigns-saya/:id/riwayat-penarikan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.create' },
    loadComponent: () => import('./pages/withdrawal-history/kantong-amal.withdrawal-history.page').then((m) => m.KantongAmalWithdrawalHistoryPage),
  },
];

/**
 * Rute admin CMS Kantong Amal — dipasang sebagai children CmsLayoutComponent
 * (§8.4 techspec), path & permission gate mengikuti persis `menuRoute`/
 * `permissionCode` yang sudah di-seed migration 0018 supaya sidebar dinamis
 * (`GET /me/menus`) benar-benar mengarah ke halaman yang hidup.
 *
 * `kantong-amal/campaigns` (permission `.campaign.view`, menu "Kantong Amal")
 * dan `kantong-amal/moderasi` (permission `.campaign.review`, menu "Moderasi
 * Campaign") sengaja dipetakan ke komponen YANG SAMA — keduanya cuma beda
 * gerbang permission untuk peran yang berbeda (Puskomda/Puskomnas Verifikator
 * punya `.review` langsung; peran lain yang nanti diberi `.view` saja tetap
 * bisa membuka daftar/riwayatnya), backend tetap menolak aksi review bila
 * caller sungguhan tidak punya `.campaign.review`.
 *
 * Queue Monitoring **tidak** punya halaman terpisah — job queue Kantong Amal
 * berbagi infrastruktur & CMS page generik dengan fitur shortlink-request
 * (`/cms/job-queue`, permission `jobqueue.view`, dibangun Phase 8 lewat merge
 * `main`); `kantong-amal/queue` (menu seeded dengan permission
 * `kantong_amal.queue.view`, saat ini cuma dimiliki Super Admin yang juga
 * otomatis punya `jobqueue.view`) di-redirect ke sana alih-alih membuat
 * halaman kedua yang murni duplikat hanya beda filter correlationType.
 */
export const kantongAmalAdminRoutes: () => Routes = () => [
  {
    path: 'kantong-amal/campaigns',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.view' },
    loadComponent: () => import('./pages/admin-campaign-moderation/kantong-amal.admin-campaign-moderation.page').then((m) => m.KantongAmalAdminCampaignModerationPage),
  },
  {
    path: 'kantong-amal/moderasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.campaign.review' },
    loadComponent: () => import('./pages/admin-campaign-moderation/kantong-amal.admin-campaign-moderation.page').then((m) => m.KantongAmalAdminCampaignModerationPage),
  },
  {
    path: 'kantong-amal/queue',
    redirectTo: 'job-queue',
  },
  {
    path: 'kantong-amal/donasi',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.donation.view' },
    loadComponent: () => import('./pages/admin-donation-monitoring/kantong-amal.admin-donation-monitoring.page').then((m) => m.KantongAmalAdminDonationMonitoringPage),
  },
  {
    path: 'kantong-amal/persetujuan-penarikan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'kantong_amal.withdrawal.approve' },
    loadComponent: () => import('./pages/admin-withdrawal-approval/kantong-amal.admin-withdrawal-approval.page').then((m) => m.KantongAmalAdminWithdrawalApprovalPage),
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
