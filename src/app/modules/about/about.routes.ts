import { Routes } from '@angular/router';

/** Rute Tentang — dipasang sebagai children dari PublicLayoutComponent. */
export const aboutRoutes: () => Routes = () => [
  { path: 'tentang', loadComponent: () => import('./pages/index/about.index.page').then((m) => m.AboutIndexPage) },
];
