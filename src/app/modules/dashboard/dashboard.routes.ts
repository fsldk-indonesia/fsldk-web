import { Routes } from '@angular/router';

/** Rute dashboard CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const dashboardRoutes: () => Routes = () => [
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () => import('./pages/index/dashboard.index.page').then((m) => m.DashboardIndexPage),
  },
];
