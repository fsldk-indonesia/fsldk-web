import { Routes } from '@angular/router';
import { verifiedGuard } from '../../core/guards/guards';

/** Rute dashboard CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const dashboardRoutes: () => Routes = () => [
  {
    path: 'dashboard',
    canActivate: [verifiedGuard],
    title: 'Dashboard',
    loadComponent: () => import('./pages/index/dashboard.index.page').then((m) => m.DashboardIndexPage),
  },
];
