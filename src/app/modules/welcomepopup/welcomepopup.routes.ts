import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute Welcome Popup CMS — dipasang sebagai children dari CmsLayoutComponent
 *  (shell FSLDK/Portal Admin saja, lihat app.routes.ts). */
export const welcomepopupRoutes: () => Routes = () => [
  {
    path: 'welcome-popup',
    canActivate: [permissionGuard],
    data: { permission: 'welcomepopup.view' },
    title: 'Welcome Popup',
    loadComponent: () => import('./pages/form/welcomepopup.form.page').then((m) => m.WelcomepopupFormPage),
  },
];
