import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute dashboard Job Queue CMS — dipasang sebagai children dari CmsLayoutComponent. */
export const jobqueueRoutes: () => Routes = () => [
  {
    path: 'job-queue',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'jobqueue.view' },
    loadComponent: () => import('./pages/index/jobqueue.index.page').then((m) => m.JobQueueIndexPage),
  },
];
