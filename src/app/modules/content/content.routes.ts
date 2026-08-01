import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute konten Landing Page CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const contentRoutes: () => Routes = () => [
  {
    path: 'contents',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'content.view' },
    loadComponent: () => import('./pages/index/content.index.page').then((m) => m.ContentIndexPage),
  },
];
