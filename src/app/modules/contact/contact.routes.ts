import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/**
 * Public routes for Contact Us module.
 */
export const contactPublicRoutes: () => Routes = () => [
  {
    path: 'tentang/kontak',
    loadComponent: () =>
      import('./pages/public-index/contact.public-index.page').then(
        (m) => m.ContactPublicIndexPage
      ),
  },
];

/**
 * CMS routes for Contact Messages Inbox.
 */
export const contactCmsRoutes: () => Routes = () => [
  {
    path: 'contact-messages',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'contact.view' },
    loadComponent: () =>
      import('./pages/index/contact.index.page').then((m) => m.ContactIndexPage),
  },
];
