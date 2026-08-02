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
