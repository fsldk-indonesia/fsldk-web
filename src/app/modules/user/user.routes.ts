import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute manajemen pengguna CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const userRoutes: () => Routes = () => [
  {
    path: 'users',
    canActivate: [permissionGuard],
    data: { permission: 'user.view' },
    title: 'Pengguna',
    loadComponent: () => import('./pages/index/user.index.page').then((m) => m.UserIndexPage),
  },
];
