import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/**
 * Public routes for the Gallery module.
 */
export function galleryPublicRoutes(): Routes {
  return [
    {
      path: 'tentang/galeri',
      loadComponent: () =>
        import('./pages/public-index/gallery.public-index.page').then(
          (m) => m.GalleryPublicIndexPage
        ),
    },
    {
      path: 'tentang/galeri/:id',
      loadComponent: () =>
        import('./pages/public-detail/gallery.public-detail.page').then(
          (m) => m.GalleryPublicDetailPage
        ),
    },
    {
      path: 'about/gallery',
      redirectTo: 'tentang/galeri',
      pathMatch: 'full',
    },
    {
      path: 'about/gallery/:id',
      redirectTo: 'tentang/galeri/:id',
    },
  ];
}

/**
 * CMS protected routes for the Gallery module.
 */
export function galleryCmsRoutes(): Routes {
  return [
    {
      path: 'galleries',
      canActivate: [verifiedGuard, permissionGuard],
      data: { permission: 'gallery.view' },
      title: 'Galeri',
      loadComponent: () =>
        import('./pages/index/gallery.index.page').then((m) => m.GalleryIndexPage),
    },
    {
      path: 'galleries/form',
      canActivate: [verifiedGuard, permissionGuard],
      data: { permission: 'gallery.create' },
      title: 'Tambah Galeri',
      loadComponent: () =>
        import('./pages/form/gallery.form.page').then((m) => m.GalleryFormPage),
    },
    {
      path: 'galleries/form/:id',
      canActivate: [verifiedGuard, permissionGuard],
      data: { permission: 'gallery.update' },
      title: 'Edit Galeri',
      loadComponent: () =>
        import('./pages/form/gallery.form.page').then((m) => m.GalleryFormPage),
    },
    {
      // Halaman detail (read-only) — komponen sama dengan form edit, dibedakan
      // lewat route data `viewOnly` yang membuat semua field disabled dan
      // tombol Simpan disembunyikan. Dipicu dengan klik baris di index (lihat
      // GalleryIndexPage) — pola sama seperti Berita/Event/Perpustakaan.
      path: 'galleries/view/:id',
      canActivate: [verifiedGuard, permissionGuard],
      data: { permission: 'gallery.view', viewOnly: true },
      title: 'Detail Galeri',
      loadComponent: () =>
        import('./pages/form/gallery.form.page').then((m) => m.GalleryFormPage),
    },
  ];
}
