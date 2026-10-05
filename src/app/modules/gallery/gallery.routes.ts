import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/**
 * Public routes for the Gallery module.
 */
export function galleryPublicRoutes(): Routes {
  return [
    {
      path: 'galeri',
      title: 'Galeri Dokumentasi',
      loadComponent: () =>
        import('./pages/public-index/gallery.public-index.page').then(
          (m) => m.GalleryPublicIndexPage
        ),
    },
    {
      path: 'galeri/:slug',
      title: 'Detail Galeri',
      loadComponent: () =>
        import('./pages/public-detail/gallery.public-detail.page').then(
          (m) => m.GalleryPublicDetailPage
        ),
    },
    // Alias legacy — URL publik dulu berprefix /tentang (dan sebelum itu
    // /about), dipertahankan sebagai redirect supaya link lama yang sudah
    // ter-index/dibagikan tidak 404.
    {
      path: 'tentang/galeri',
      redirectTo: 'galeri',
      pathMatch: 'full',
    },
    {
      path: 'tentang/galeri/:slug',
      redirectTo: 'galeri/:slug',
    },
    {
      path: 'about/gallery',
      redirectTo: 'galeri',
      pathMatch: 'full',
    },
    {
      path: 'about/gallery/:id',
      redirectTo: 'galeri/:id',
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
      canActivate: [permissionGuard],
      data: { permission: 'gallery.view' },
      title: 'Galeri',
      loadComponent: () =>
        import('./pages/index/gallery.index.page').then((m) => m.GalleryIndexPage),
    },
    {
      path: 'galleries/form',
      canActivate: [permissionGuard],
      data: { permission: 'gallery.create' },
      title: 'Tambah Galeri',
      loadComponent: () =>
        import('./pages/form/gallery.form.page').then((m) => m.GalleryFormPage),
    },
    {
      path: 'galleries/form/:id',
      canActivate: [permissionGuard],
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
      canActivate: [permissionGuard],
      data: { permission: 'gallery.view', viewOnly: true },
      title: 'Detail Galeri',
      loadComponent: () =>
        import('./pages/form/gallery.form.page').then((m) => m.GalleryFormPage),
    },
  ];
}
