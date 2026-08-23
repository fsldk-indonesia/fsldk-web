import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute manajemen shortlink CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const shortlinkRoutes: () => Routes = () => [
  {
    path: 'shortlinks',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'shortlink.view' },
    loadComponent: () => import('./pages/index/shortlink.index.page').then((m) => m.ShortlinkIndexPage),
  },
  {
    path: 'shortlink-requests',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'shortlink.view' },
    loadComponent: () => import('./pages/request-index/shortlinkrequest.index.page').then((m) => m.ShortLinkRequestIndexPage),
  },
];

/**
 * Rute publik form pengajuan shortlink — dipasang sebagai children dari
 * PublicLayoutComponent, path STATIS (`shortlink/ajukan`, dua segmen) jadi
 * tidak pernah bentrok dengan rute redirect catch-all `:key` (satu segmen).
 */
export const shortlinkPublicRoutes: () => Routes = () => [
  {
    path: 'shortlink/ajukan',
    loadComponent: () => import('./pages/public-submit/shortlinkrequest.submit.page').then((m) => m.ShortlinkRequestSubmitPage),
  },
];

/**
 * Rute redirect publik `/:key` — dipasang di level root (bukan children
 * layout mana pun) dan HARUS ditempatkan setelah seluruh rute bernama
 * (publik/auth/cms) di app.routes.ts, agar path seperti /login atau /berita
 * tetap ditangani rute aslinya, bukan tertangkap sebagai kunci shortlink.
 */
export const shortlinkRedirectRoutes: () => Routes = () => [
  {
    path: ':key',
    loadComponent: () => import('./pages/redirect/shortlink.redirect.page').then((m) => m.ShortlinkRedirectPage),
  },
];
