import { Routes } from '@angular/router';

/** Public route: Statistik Jaringan (data agregat LDK/Puskomda/Puskomnas). */
export const statisticPublicRoutes: () => Routes = () => [
  {
    path: 'tentang/statistik-jaringan',
    loadComponent: () =>
      import('./pages/index/statistic.index.page').then((m) => m.StatisticIndexPage),
  },
];
