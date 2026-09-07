import { Routes } from '@angular/router';
import { verifiedGuard, permissionGuard } from '../../core/guards/guards';

/**
 * Rute manajemen QR Code CMS — dipasang sebagai children dari
 * CmsLayoutComponent. Kedua path berbagi prefix `qrcode/` supaya dikelompokkan
 * jadi satu grup dropdown "QR Code" di sidebar (lihat SIDEBAR_GROUPS di
 * cms-layout.component.ts, pola sama dengan "Shortlink" & "Kantong Amal").
 */
export const qrcodeRoutes: () => Routes = () => [
  {
    path: 'qrcode/list',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'qrcode.view' },
    loadComponent: () => import('./pages/index/qrcode.index.page').then((m) => m.QrcodeIndexPage),
  },
  {
    path: 'qrcode/permintaan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'qrcode.view' },
    loadComponent: () => import('./pages/request-index/qrcoderequest.index.page').then((m) => m.QRCodeRequestIndexPage),
  },
];

/**
 * Rute publik form pengajuan QR Code — dipasang sebagai children dari
 * PublicLayoutComponent, path statis (`qrcode/ajukan`). Tidak ada rute
 * redirect: gambar QR meng-encode URL tujuan LANGSUNG, jadi pemindai tidak
 * pernah melewati domain ini.
 */
export const qrcodePublicRoutes: () => Routes = () => [
  {
    path: 'qrcode/ajukan',
    loadComponent: () => import('./pages/public-submit/qrcoderequest.submit.page').then((m) => m.QrcodeRequestSubmitPage),
  },
];
