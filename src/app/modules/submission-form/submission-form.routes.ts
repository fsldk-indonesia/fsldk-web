import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute form builder pendataan — dipasang sebagai children dari CmsLayoutComponent. */
export const submissionFormRoutes: () => Routes = () => [
  {
    path: 'submission-forms',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission_form.view' },
    loadComponent: () => import('./pages/index/submission-form.index.page').then((m) => m.SubmissionFormIndexPage),
  },
  {
    path: 'submission-forms/:formID',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'submission_form.view' },
    loadComponent: () => import('./pages/builder/submission-form.builder.page').then((m) => m.SubmissionFormBuilderPage),
  },
];
