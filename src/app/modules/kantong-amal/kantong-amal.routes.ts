import { Routes } from '@angular/router';

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
