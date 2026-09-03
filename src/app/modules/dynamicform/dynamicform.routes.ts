import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Public fill route — mounted as a child of PublicLayoutComponent. The static
 *  `form/` prefix keeps it clear of the shortlink catch-all `:key`. */
export const dynamicFormPublicRoutes: () => Routes = () => [
  {
    path: 'form/:slug',
    loadComponent: () => import('./pages/public-fill/dynamicform.public-fill.page').then((m) => m.DynamicFormPublicFillPage),
  },
];

/** CMS routes — mounted as children of the FSLDK CmsLayoutComponent. */
export const dynamicFormCmsRoutes: () => Routes = () => [
  {
    path: 'dynamic-forms',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'dynamicform.view' },
    loadComponent: () => import('./pages/index/dynamicform.index.page').then((m) => m.DynamicFormIndexPage),
  },
  {
    path: 'dynamic-forms/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'dynamicform.create' },
    loadComponent: () => import('./pages/form/dynamicform.form.page').then((m) => m.DynamicFormFormPage),
  },
  {
    path: 'dynamic-forms/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'dynamicform.update' },
    loadComponent: () => import('./pages/form/dynamicform.form.page').then((m) => m.DynamicFormFormPage),
  },
  {
    path: 'dynamic-forms/:id/builder',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'dynamicform.update' },
    loadComponent: () => import('./pages/builder/dynamicform.builder.page').then((m) => m.DynamicFormBuilderPage),
  },
  {
    path: 'dynamic-forms/:id/responses',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'dynamicform.view' },
    loadComponent: () => import('./pages/responses/dynamicform.responses.page').then((m) => m.DynamicFormResponsesPage),
  },
  {
    path: 'dynamic-forms/:id/responses/:subId',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'dynamicform.update' },
    loadComponent: () => import('./pages/response-edit/dynamicform.response-edit.page').then((m) => m.DynamicFormResponseEditPage),
  },
  {
    path: 'dynamic-forms/:id/analytics',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'dynamicform.view' },
    loadComponent: () => import('./pages/analytics/dynamicform.analytics.page').then((m) => m.DynamicFormAnalyticsPage),
  },
];
