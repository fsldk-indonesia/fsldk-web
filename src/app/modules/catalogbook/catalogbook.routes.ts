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
    title: 'Perpustakaan',
    loadComponent: () => import('./pages/index/catalogbook.index.page').then((m) => m.CatalogBookIndexPage),
  },
  {
    path: 'catalog-books/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'catalogbook.create' },
    title: 'Tambah Buku',
    loadComponent: () => import('./pages/form/catalogbook.form.page').then((m) => m.CatalogBookFormPage),
  },
  {
    path: 'catalog-books/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'catalogbook.update' },
    title: 'Edit Buku',
    loadComponent: () => import('./pages/form/catalogbook.form.page').then((m) => m.CatalogBookFormPage),
  },
  {
    // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
    // lewat route data `viewOnly` yang membuat semua field disabled dan
    // tombol Simpan disembunyikan. Dipicu dengan klik baris di index (lihat
    // CatalogBookIndexPage) — pola sama seperti Berita/Event.
    path: 'catalog-books/view/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'catalogbook.view', viewOnly: true },
    title: 'Detail Buku',
    loadComponent: () => import('./pages/form/catalogbook.form.page').then((m) => m.CatalogBookFormPage),
  },
];
