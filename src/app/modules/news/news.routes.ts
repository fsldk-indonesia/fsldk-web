import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute publik berita — dipasang sebagai children dari PublicLayoutComponent. */
export const newsPublicRoutes: () => Routes = () => [
  { path: 'berita', loadComponent: () => import('./pages/public-index/news.public-index.page').then((m) => m.NewsPublicIndexPage) },
  { path: 'berita/:slug', loadComponent: () => import('./pages/public-detail/news.public-detail.page').then((m) => m.NewsPublicDetailPage) },
];

/** Rute manajemen berita CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const newsCmsRoutes: () => Routes = () => [
  {
    path: 'news',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'news.view' },
    loadComponent: () => import('./pages/index/news.index.page').then((m) => m.NewsIndexPage),
  },
  {
    path: 'news/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'news.create' },
    loadComponent: () => import('./pages/form/news.form.page').then((m) => m.NewsFormPage),
  },
  {
    path: 'news/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'news.update' },
    loadComponent: () => import('./pages/form/news.form.page').then((m) => m.NewsFormPage),
  },
];
