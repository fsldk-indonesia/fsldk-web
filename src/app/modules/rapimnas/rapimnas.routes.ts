import { Routes } from '@angular/router';

/** Rute publik Rapimnas — dipasang sebagai children dari RapimnasLayoutComponent
 *  (shell sendiri, lihat app.routes.ts), path relatif terhadap prefix /rapimnas.
 *  SEMENTARA hanya berisi halaman Beranda (index) — 5 halaman publik lainnya
 *  (tentang/jadwal/arsip/pendaftaran) ditambahkan ke array ini secara bertahap
 *  seiring selesainya masing-masing task; rapimnasCmsRoutes() ditambahkan ke
 *  file ini begitu halaman CMS Setup-nya ada. */
export function rapimnasPublicRoutes(): Routes {
  return [
    { path: '', title: 'RAPIMNAS 1 FSLDK Indonesia 2026', loadComponent: () => import('./pages/index/rapimnas.index.page').then((m) => m.RapimnasIndexPage) },
  ];
}
