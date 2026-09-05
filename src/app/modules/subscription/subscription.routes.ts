import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Public route: unsubscribe link opened from the welcome email. */
export const subscriptionPublicRoutes: () => Routes = () => [
  {
    path: 'unsubscribe',
    loadComponent: () =>
      import('./pages/unsubscribe/subscription.unsubscribe.page').then((m) => m.SubscriptionUnsubscribePage),
  },
];

/** CMS route: Subscription management (list, bulk add, edit, delete). */
export const subscriptionCmsRoutes: () => Routes = () => [
  {
    path: 'subscribers',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'subscription.view' },
    loadComponent: () =>
      import('./pages/index/subscription.index.page').then((m) => m.SubscriptionIndexPage),
  },
];
