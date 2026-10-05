import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/**
 * Public routes for Contact Us module.
 */
export const contactPublicRoutes: () => Routes = () => [
  {
    path: 'kontak',
    title: 'Hubungi Kami',
    loadComponent: () =>
      import('./pages/public-index/contact.public-index.page').then(
        (m) => m.ContactPublicIndexPage
      ),
  },
  // Alias legacy — URL publik dulu berprefix /tentang, dipertahankan sebagai
  // redirect supaya link lama tidak 404.
  {
    path: 'tentang/kontak',
    redirectTo: 'kontak',
    pathMatch: 'full',
  },
];

/**
 * CMS routes for Contact Messages Inbox.
 */
export const contactCmsRoutes: () => Routes = () => [
  {
    path: 'contact-messages',
    canActivate: [permissionGuard],
    data: { permission: 'contact.view' },
    title: 'Pesan Kontak',
    loadComponent: () =>
      import('./pages/index/contact.index.page').then((m) => m.ContactIndexPage),
  },
];
