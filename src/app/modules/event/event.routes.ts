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
    loadComponent: () => import('./pages/index/event.index.page').then((m) => m.EventIndexPage),
  },
  {
    path: 'events/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'event.create' },
    loadComponent: () => import('./pages/form/event.form.page').then((m) => m.EventFormPage),
  },
  {
    path: 'events/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'event.update' },
    loadComponent: () => import('./pages/form/event.form.page').then((m) => m.EventFormPage),
  },
];
