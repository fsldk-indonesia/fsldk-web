import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute manajemen pengguna CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const userRoutes: () => Routes = () => [
  {
    path: 'users',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'user.view' },
    loadComponent: () => import('./pages/index/user.index.page').then((m) => m.UserIndexPage),
  },
];
