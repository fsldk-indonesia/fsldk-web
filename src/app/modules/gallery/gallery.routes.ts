import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

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
      canActivate: [permissionGuard],
      data: { permission: 'gallery.view' },
      loadComponent: () =>
        import('./pages/index/gallery.index.page').then((m) => m.GalleryIndexPage),
    },
    {
      path: 'galleries/create',
      canActivate: [permissionGuard],
      data: { permission: 'gallery.create' },
      loadComponent: () =>
        import('./pages/form/gallery.form.page').then((m) => m.GalleryFormPage),
    },
    {
      path: 'galleries/:id/edit',
      canActivate: [permissionGuard],
      data: { permission: 'gallery.update' },
      loadComponent: () =>
        import('./pages/form/gallery.form.page').then((m) => m.GalleryFormPage),
    },
  ];
}
