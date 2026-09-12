import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Public event routes — mounted as children of PublicLayoutComponent. */
export const eventPublicRoutes: () => Routes = () => [
  { path: 'event', loadComponent: () => import('./pages/public-index/event.public-index.page').then((m) => m.EventPublicIndexPage) },
  { path: 'event/:slug', loadComponent: () => import('./pages/public-detail/event.public-detail.page').then((m) => m.EventPublicDetailPage) },
];

/** CMS event routes — mounted as children of CmsLayoutComponent. */
export const eventCmsRoutes: () => Routes = () => [
  {
    path: 'events',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'event.view' },
    title: 'Event',
    loadComponent: () => import('./pages/index/event.index.page').then((m) => m.EventIndexPage),
  },
  {
    path: 'events/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'event.create' },
    title: 'Tambah Event',
    loadComponent: () => import('./pages/form/event.form.page').then((m) => m.EventFormPage),
  },
  {
    path: 'events/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'event.update' },
    title: 'Edit Event',
    loadComponent: () => import('./pages/form/event.form.page').then((m) => m.EventFormPage),
  },
  {
    // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
    // lewat route data `viewOnly` yang membuat semua field disabled dan
    // tombol Simpan disembunyikan. Dipicu dengan klik baris di index (lihat
    // EventIndexPage), bukan cuma dari ikon Edit — pola sama seperti Berita.
    path: 'events/view/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'event.view', viewOnly: true },
    title: 'Detail Event',
    loadComponent: () => import('./pages/form/event.form.page').then((m) => m.EventFormPage),
  },
];
