import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute manajemen role CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const roleRoutes: () => Routes = () => [
  {
    path: 'roles',
    canActivate: [permissionGuard],
    data: { permission: 'role.view' },
    title: 'Role Pengguna',
    loadComponent: () => import('./pages/index/role.index.page').then((m) => m.RoleIndexPage),
  },
];
