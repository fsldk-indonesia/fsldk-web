import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute modul Pengurus — dipasang sebagai children dari CmsLayoutComponent
 *  di 3 tier (cms-ldk/cms-puskomda/cms-puskomnas), TIDAK PERNAH cms (Portal
 *  Admin). Beda dari organizationRoutes(): factory ini menerima
 *  permissionCode sebagai parameter karena permissionGuard hanya membaca
 *  SATU route.data['permission'], dan tiap tier butuh kode izin berbeda
 *  (pengurus.ldk.manage / pengurus.puskomda.manage / pengurus.puskomnas.manage). */
export const pengurusRoutes: (permissionCode: string) => Routes = (permissionCode) => [
  {
    path: 'pengurus',
    canActivate: [permissionGuard],
    data: { permission: permissionCode },
    title: 'Pengurus',
    loadComponent: () => import('./pages/index/pengurus.index.page').then((m) => m.PengurusIndexPage),
  },
];
