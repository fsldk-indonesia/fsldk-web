import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

export function structurePublicRoutes(): Routes {
  return [
    {
      path: 'tentang/struktur',
      loadComponent: () => import('./pages/public-index/structure.public-index.page').then((m) => m.StructurePublicIndexPage),
    },
  ];
}

export function structureCmsRoutes(): Routes {
  return [
    {
      path: 'structures',
      canActivate: [permissionGuard],
      data: { permission: 'structure.view' },
      title: 'Struktur Org',
      loadComponent: () => import('./pages/index/structure.index.page').then((m) => m.StructureIndexPage),
    },
    {
      path: 'structures/create',
      canActivate: [permissionGuard],
      data: { permission: 'structure.create' },
      title: 'Tambah Struktur',
      loadComponent: () => import('./pages/form/structure.form.page').then((m) => m.StructureFormPage),
    },
    {
      path: 'structures/:id/edit',
      canActivate: [permissionGuard],
      data: { permission: 'structure.update' },
      title: 'Edit Struktur',
      loadComponent: () => import('./pages/form/structure.form.page').then((m) => m.StructureFormPage),
    },
    {
      // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
      // lewat route data `viewOnly` yang membuat semua field disabled dan
      // tombol Simpan disembunyikan. Dipicu dengan klik baris di index (lihat
      // StructureIndexPage) — pola sama seperti Berita/Event/Perpustakaan/Jadwal.
      path: 'structures/:id/view',
      canActivate: [permissionGuard],
      data: { permission: 'structure.view', viewOnly: true },
      title: 'Detail Struktur',
      loadComponent: () => import('./pages/form/structure.form.page').then((m) => m.StructureFormPage),
    },
  ];
}
