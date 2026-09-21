import { Routes } from '@angular/router';

/** Rute Beranda — dipasang sebagai children dari PublicLayoutComponent. */
export const homeRoutes: () => Routes = () => [
  { path: '', title: 'Beranda', loadComponent: () => import('./pages/index/home.index.page').then((m) => m.HomeIndexPage) },
];
