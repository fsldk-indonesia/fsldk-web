import { Routes } from '@angular/router';

/** Rute Kontak — dipasang sebagai children dari PublicLayoutComponent. */
export const contactRoutes: () => Routes = () => [
  { path: 'kontak', loadComponent: () => import('./pages/index/contact.index.page').then((m) => m.ContactIndexPage) },
];
