import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute publik artikel — dipasang sebagai children dari PublicLayoutComponent. */
export const articlePublicRoutes: () => Routes = () => [
  { path: 'artikel', loadComponent: () => import('./pages/public-index/article.public-index.page').then((m) => m.ArticlePublicIndexPage) },
  { path: 'artikel/:slug', loadComponent: () => import('./pages/public-detail/article.public-detail.page').then((m) => m.ArticlePublicDetailPage) },
];

/** Rute manajemen artikel CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const articleCmsRoutes: () => Routes = () => [
  {
    path: 'articles',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'article.view' },
    title: 'Artikel',
    loadComponent: () => import('./pages/index/article.index.page').then((m) => m.ArticleIndexPage),
  },
  {
    path: 'articles/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'article.create' },
    title: 'Tambah Artikel',
    loadComponent: () => import('./pages/form/article.form.page').then((m) => m.ArticleFormPage),
  },
  {
    path: 'articles/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'article.update' },
    title: 'Edit Artikel',
    loadComponent: () => import('./pages/form/article.form.page').then((m) => m.ArticleFormPage),
  },
  {
    // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
    // lewat route data `viewOnly` yang membuat semua field disabled dan
    // tombol Simpan disembunyikan. Dipicu dengan klik baris di index (lihat
    // ArticleIndexPage), bukan cuma dari ikon Edit.
    path: 'articles/view/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'article.view', viewOnly: true },
    title: 'Detail Artikel',
    loadComponent: () => import('./pages/form/article.form.page').then((m) => m.ArticleFormPage),
  },
];
