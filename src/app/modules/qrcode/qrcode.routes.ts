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
    title: 'Daftar QR Code',
    loadComponent: () => import('./pages/index/qrcode.index.page').then((m) => m.QrcodeIndexPage),
  },
  {
    path: 'qrcode/permintaan',
    canActivate: [verifiedGuard, permissionGuard],
    data: { permission: 'qrcode.view' },
    title: 'Permintaan QR Code',
    loadComponent: () => import('./pages/request-index/qrcoderequest.index.page').then((m) => m.QRCodeRequestIndexPage),
  },
];

/**
 * Rute publik QR Code — dipasang sebagai children dari PublicLayoutComponent:
 * - `qrcode/ajukan` — form pengajuan.
 * - `qr/:id` — halaman detail/unduh gambar QR (tautannya dikirim ke pemohon
 *   lewat WhatsApp/email saat permintaan disetujui). BUKAN redirect —
 *   gambar QR meng-encode URL tujuan LANGSUNG.
 */
export const qrcodePublicRoutes: () => Routes = () => [
  {
    path: 'qrcode/ajukan',
    loadComponent: () => import('./pages/public-submit/qrcoderequest.submit.page').then((m) => m.QrcodeRequestSubmitPage),
  },
  {
    path: 'qr/:id',
    loadComponent: () => import('./pages/detail/qrcode.detail.page').then((m) => m.QrcodeDetailPage),
  },
];
