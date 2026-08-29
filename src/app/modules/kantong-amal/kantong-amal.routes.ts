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
