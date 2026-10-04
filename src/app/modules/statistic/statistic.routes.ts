import { Routes } from '@angular/router';

/** Public route: Statistik Jaringan (data agregat LDK/Puskomda/Puskomnas). */
export const statisticPublicRoutes: () => Routes = () => [
  {
    path: 'statistik-jaringan',
    title: 'Statistik Jaringan',
    loadComponent: () =>
      import('./pages/index/statistic.index.page').then((m) => m.StatisticIndexPage),
  },
  // Alias legacy — URL publik dulu berprefix /tentang, dipertahankan sebagai
  // redirect supaya link lama tidak 404.
  {
    path: 'tentang/statistik-jaringan',
    redirectTo: 'statistik-jaringan',
    pathMatch: 'full',
  },
];
