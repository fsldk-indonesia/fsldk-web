import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Public finance-format route — mounted as a child of PublicLayoutComponent. */
export const financeformatPublicRoutes: () => Routes = () => [
  { path: 'format-keuangan', loadComponent: () => import('./pages/public-index/financeformat.public-index.page').then((m) => m.FinanceFormatPublicIndexPage) },
];

/** CMS finance-format management routes — mounted as children of CmsLayoutComponent. */
export const financeformatCmsRoutes: () => Routes = () => [
  {
    path: 'finance-formats',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'financeformat.view' },
    loadComponent: () => import('./pages/index/financeformat.index.page').then((m) => m.FinanceFormatIndexPage),
  },
  {
    path: 'finance-formats/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'financeformat.create' },
    loadComponent: () => import('./pages/form/financeformat.form.page').then((m) => m.FinanceFormatFormPage),
  },
  {
    path: 'finance-formats/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'financeformat.update' },
    loadComponent: () => import('./pages/form/financeformat.form.page').then((m) => m.FinanceFormatFormPage),
  },
];
