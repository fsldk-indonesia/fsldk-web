import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute App Settings CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const settingRoutes: () => Routes = () => [
  {
    path: 'settings',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'setting.view' },
    title: 'App Settings',
    loadComponent: () => import('./pages/index/setting.index.page').then((m) => m.SettingIndexPage),
  },
];
