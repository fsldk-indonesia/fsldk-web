import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Public schedule routes — mounted as children of PublicLayoutComponent. */
export const schedulePublicRoutes: () => Routes = () => [
  { path: 'jadwal', title: 'Jadwal', loadComponent: () => import('./pages/public-index/schedule.public-index.page').then((m) => m.SchedulePublicIndexPage) },
];

/** CMS schedule management routes — mounted as children of CmsLayoutComponent. */
export const scheduleCmsRoutes: () => Routes = () => [
  {
    path: 'schedules',
    canActivate: [permissionGuard],
    data: { permission: 'schedule.view' },
    title: 'Jadwal',
    loadComponent: () => import('./pages/index/schedule.index.page').then((m) => m.ScheduleIndexPage),
  },
  {
    path: 'schedules/form',
    canActivate: [permissionGuard],
    data: { permission: 'schedule.create' },
    title: 'Tambah Jadwal',
    loadComponent: () => import('./pages/form/schedule.form.page').then((m) => m.ScheduleFormPage),
  },
  {
    path: 'schedules/form/:id',
    canActivate: [permissionGuard],
    data: { permission: 'schedule.update' },
    title: 'Edit Jadwal',
    loadComponent: () => import('./pages/form/schedule.form.page').then((m) => m.ScheduleFormPage),
  },
  {
    // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
    // lewat route data `viewOnly` yang membuat semua field disabled dan
    // tombol Simpan disembunyikan. Dipicu dengan klik baris di index (lihat
    // ScheduleIndexPage) — pola sama seperti Berita/Event/Perpustakaan.
    path: 'schedules/view/:id',
    canActivate: [permissionGuard],
    data: { permission: 'schedule.view', viewOnly: true },
    title: 'Detail Jadwal',
    loadComponent: () => import('./pages/form/schedule.form.page').then((m) => m.ScheduleFormPage),
  },
];
