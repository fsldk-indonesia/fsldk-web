import { Routes } from '@angular/router';
import { verifiedGuard } from '../../core/guards/guards';

/** Rute dashboard CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const dashboardRoutes: () => Routes = () => [
  {
    path: 'dashboard',
    canActivate: [verifiedGuard],
    loadComponent: () => import('./pages/index/dashboard.index.page').then((m) => m.DashboardIndexPage),
  },
];
