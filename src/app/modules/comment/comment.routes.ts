import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute Comment Control Center — dipasang sebagai children dari CmsLayoutComponent. */
export const commentCmsRoutes: () => Routes = () => [
  {
    path: 'comments',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'comment.view' },
    loadComponent: () => import('./pages/index/comment.index.page').then((m) => m.CommentIndexPage),
  },
  {
    path: 'comments/:id',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'comment.view' },
    loadComponent: () => import('./pages/detail/comment.detail.page').then((m) => m.CommentDetailPage),
  },
];
