import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/guards';

/** Rute publik Rapimnas — dipasang sebagai children dari RapimnasLayoutComponent
 *  (shell sendiri, lihat app.routes.ts), path relatif terhadap prefix /rapimnas.
 *  rapimnasCmsRoutes() ditambahkan ke file ini di Task 18, begitu halaman CMS
 *  Setup-nya ada. */
export function rapimnasPublicRoutes(): Routes {
  return [
    { path: '', title: 'RAPIMNAS 1 FSLDK Indonesia 2026', loadComponent: () => import('./pages/index/rapimnas.index.page').then((m) => m.RapimnasIndexPage) },
    { path: 'tentang', title: 'Tentang — RAPIMNAS 1 FSLDK Indonesia 2026', loadComponent: () => import('./pages/tentang/rapimnas.tentang.page').then((m) => m.RapimnasTentangPage) },
    { path: 'jadwal', title: 'Jadwal — RAPIMNAS 1 FSLDK Indonesia 2026', loadComponent: () => import('./pages/jadwal/rapimnas.jadwal.page').then((m) => m.RapimnasJadwalPage) },
    { path: 'arsip', title: 'Arsip — RAPIMNAS 1 FSLDK Indonesia 2026', loadComponent: () => import('./pages/arsip/rapimnas.arsip.page').then((m) => m.RapimnasArsipPage) },
    { path: 'pendaftaran/panitia', title: 'Pendaftaran Panitia — RAPIMNAS 1 FSLDK Indonesia 2026', loadComponent: () => import('./pages/pendaftaran-panitia/rapimnas.pendaftaran-panitia.page').then((m) => m.RapimnasPendaftaranPanitiaPage) },
    { path: 'pendaftaran/peserta', title: 'Pendaftaran Peserta — RAPIMNAS 1 FSLDK Indonesia 2026', loadComponent: () => import('./pages/pendaftaran-peserta/rapimnas.pendaftaran-peserta.page').then((m) => m.RapimnasPendaftaranPesertaPage) },
  ];
}

/** Rute CMS "Rapimnas Setup" — dipasang HANYA di bawah /cms (FSLDK tier),
 *  TIDAK di cms-ldk/cms-puskomda/cms-puskomnas (design spec §CMS menu
 *  visible to FSLDK tier only). Permission rapimnas.view/rapimnas.update
 *  diseed migration backend ke Super Admin saja — lapis kedua di atas
 *  pembatasan struktural ini. */
export function rapimnasCmsRoutes(): Routes {
  return [
    {
      path: 'rapimnas-setup',
      canActivate: [permissionGuard],
      data: { permission: 'rapimnas.view' },
      title: 'Rapimnas Setup',
      loadComponent: () => import('./pages/cms-setup/rapimnas.cms-setup.page').then((m) => m.RapimnasCmsSetupPage),
    },
  ];
}
