import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Label judul "organization/profile" per tier shell — satu route ini
 *  dipasang identik di cms-ldk/cms-puskomda/cms-puskomnas (lihat
 *  OrganizationProfilePage, generic untuk organisasi tipe apa pun), jadi
 *  labelnya dibaca dari `tier` milik shell leluhur (paramsInheritanceStrategy
 *  'always' di app.config.ts), bukan string statis "Profil LDK" semata. */
export const PROFILE_TITLE_BY_TIER: Record<string, string> = {
  PUSKOMDA: 'Profil Puskomda', PUSKOMNAS: 'Profil Puskomnas',
};

/** Rute modul organization — dipasang sebagai children dari CmsLayoutComponent. */
export const organizationRoutes: () => Routes = () => [
  {
    path: 'organization/profile',
    canActivate: [permissionGuard],
    data: { permission: 'organization.profile.manage' },
    title: (route) => PROFILE_TITLE_BY_TIER[route.data['tier'] as string] ?? 'Profil LDK',
    loadComponent: () => import('./pages/profile/organization.profile.page').then((m) => m.OrganizationProfilePage),
  },
  {
    path: 'organizations/ldk',
    canActivate: [permissionGuard],
    data: { permission: 'organization.ldk.list' },
    title: 'LDK',
    loadComponent: () => import('./pages/ldk-list/organization.ldk-list.page').then((m) => m.OrganizationLdkListPage),
  },
  {
    path: 'organizations/ldk-nasional',
    canActivate: [permissionGuard],
    data: { permission: 'organization.ldk.list.national' },
    title: 'LDK',
    loadComponent: () => import('./pages/ldk-list/organization.ldk-list.page').then((m) => m.OrganizationLdkListPage),
  },
  {
    path: 'organizations/puskomda',
    canActivate: [permissionGuard],
    data: { permission: 'organization.puskomda.list' },
    title: 'Puskomda',
    loadComponent: () => import('./pages/puskomda-list/organization.puskomda-list.page').then((m) => m.OrganizationPuskomdaListPage),
  },
];
