import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute pengisian & status pendataan — dipasang sebagai children dari CmsLayoutComponent. */
export const submissionRoutes: () => Routes = () => [
  {
    path: 'submissions/pendataan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.create' },
    loadComponent: () => import('./pages/pendataan/submission.pendataan.page').then((m) => m.SubmissionPendataanPage),
  },
  {
    path: 'submissions/status',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission.view' },
    loadComponent: () => import('./pages/status/submission.status.page').then((m) => m.SubmissionStatusPage),
  },
];
