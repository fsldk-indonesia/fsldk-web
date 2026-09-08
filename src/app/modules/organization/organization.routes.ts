import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/** Rute modul organization — dipasang sebagai children dari CmsLayoutComponent. */
export const organizationRoutes: () => Routes = () => [
  {
    path: 'organization/profile',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'organization.profile.manage' },
    title: 'Profil LDK',
    loadComponent: () => import('./pages/profile/organization.profile.page').then((m) => m.OrganizationProfilePage),
  },
  {
    path: 'organizations/ldk',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'organization.ldk.list' },
    title: 'LDK',
    loadComponent: () => import('./pages/ldk-list/organization.ldk-list.page').then((m) => m.OrganizationLdkListPage),
  },
  {
    path: 'organizations/ldk-nasional',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'organization.ldk.list.national' },
    title: 'LDK',
    loadComponent: () => import('./pages/ldk-list/organization.ldk-list.page').then((m) => m.OrganizationLdkListPage),
  },
  {
    path: 'organizations/puskomda',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'organization.puskomda.list' },
    title: 'Puskomda',
    loadComponent: () => import('./pages/puskomda-list/organization.puskomda-list.page').then((m) => m.OrganizationPuskomdaListPage),
  },
];
