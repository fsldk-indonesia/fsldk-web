import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/**
 * Rute manajemen QR Code CMS — dipasang sebagai children dari
 * CmsLayoutComponent. Kedua path berbagi prefix `qrcode/` supaya dikelompokkan
 * jadi satu grup dropdown "QR Code" di sidebar (lihat SIDEBAR_GROUPS di
 * cms-layout.component.ts, pola sama dengan "Shortlink" & "Kantong Amal").
 */
export const qrcodeRoutes: () => Routes = () => [
  {
    path: 'qrcode/list',
    canActivate: [permissionGuard],
    data: { permission: 'qrcode.view' },
    title: 'Daftar QR Code',
    loadComponent: () => import('./pages/index/qrcode.index.page').then((m) => m.QrcodeIndexPage),
  },
  {
    path: 'qrcode/permintaan',
    canActivate: [permissionGuard],
    data: { permission: 'qrcode.view' },
    title: 'Permintaan QR Code',
    loadComponent: () => import('./pages/request-index/qrcoderequest.index.page').then((m) => m.QRCodeRequestIndexPage),
  },
];

/**
 * Rute publik QR Code — dipasang sebagai children dari PublicLayoutComponent:
 * - `qrcode/ajukan` — form pengajuan (navbar/footer landing page tetap ada).
 */
export const qrcodePublicRoutes: () => Routes = () => [
  {
    path: 'qrcode/ajukan',
    title: 'Ajukan QR Code',
    loadComponent: () => import('./pages/public-submit/qrcoderequest.submit.page').then((m) => m.QrcodeRequestSubmitPage),
  },
];

/**
 * `qr/:id` — halaman detail/unduh gambar QR (tautannya dikirim ke pemohon
 * lewat WhatsApp/email saat permintaan disetujui). BUKAN redirect — gambar
 * QR meng-encode URL tujuan LANGSUNG.
 *
 * SENGAJA dipasang sebagai top-level route TERPISAH dari PublicLayoutComponent
 * (lihat app.routes.ts) — tanpa navbar/footer/WhatsApp FAB landing page, mirip
 * AuthLayoutComponent (shell sendiri). Halaman ini sendiri yang memikul
 * backdrop penuh-layar (gradien diagonal hijau tua ala hero gelap Goods/
 * Berita/Galeri detail), bukan dibungkus layout tambahan, karena cuma satu
 * halaman yang butuh treatment ini.
 */
export const qrcodeDetailRoutes: () => Routes = () => [
  {
    path: 'qr/:id',
    title: 'QR Code',
    loadComponent: () => import('./pages/detail/qrcode.detail.page').then((m) => m.QrcodeDetailPage),
  },
];
