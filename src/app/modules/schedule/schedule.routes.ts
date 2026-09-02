import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Public schedule routes — mounted as children of PublicLayoutComponent. */
export const schedulePublicRoutes: () => Routes = () => [
  { path: 'jadwal', loadComponent: () => import('./pages/public-index/schedule.public-index.page').then((m) => m.SchedulePublicIndexPage) },
];

/** CMS schedule management routes — mounted as children of CmsLayoutComponent. */
export const scheduleCmsRoutes: () => Routes = () => [
  {
    path: 'schedules',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'schedule.view' },
    loadComponent: () => import('./pages/index/schedule.index.page').then((m) => m.ScheduleIndexPage),
  },
  {
    path: 'schedules/form',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'schedule.create' },
    loadComponent: () => import('./pages/form/schedule.form.page').then((m) => m.ScheduleFormPage),
  },
  {
    path: 'schedules/form/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'schedule.update' },
    loadComponent: () => import('./pages/form/schedule.form.page').then((m) => m.ScheduleFormPage),
  },
];
