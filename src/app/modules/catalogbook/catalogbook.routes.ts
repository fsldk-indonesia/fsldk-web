import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Public catalogbook routes — mounted as children of PublicLayoutComponent. */
export const catalogbookPublicRoutes: () => Routes = () => [
  { path: 'perpustakaan', loadComponent: () => import('./pages/public-index/catalogbook.public-index.page').then((m) => m.CatalogBookPublicIndexPage) },
  { path: 'perpustakaan/:slug', loadComponent: () => import('./pages/public-detail/catalogbook.public-detail.page').then((m) => m.CatalogBookPublicDetailPage) },
];

/** CMS catalogbook management routes — mounted as children of CmsLayoutComponent. */
export const catalogbookCmsRoutes: () => Routes = () => [
  {
    path: 'catalog-books',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'catalogbook.view' },
    loadComponent: () => import('./pages/index/catalogbook.index.page').then((m) => m.CatalogBookIndexPage),
  },
  {
    path: 'catalog-books/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'catalogbook.create' },
    loadComponent: () => import('./pages/form/catalogbook.form.page').then((m) => m.CatalogBookFormPage),
  },
  {
    path: 'catalog-books/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'catalogbook.update' },
    loadComponent: () => import('./pages/form/catalogbook.form.page').then((m) => m.CatalogBookFormPage),
  },
];
