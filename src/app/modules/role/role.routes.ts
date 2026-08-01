import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute manajemen role CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const roleRoutes: () => Routes = () => [
  {
    path: 'roles',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'role.view' },
    loadComponent: () => import('./pages/index/role.index.page').then((m) => m.RoleIndexPage),
  },
];
