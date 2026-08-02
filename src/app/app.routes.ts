import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { CmsLayoutComponent } from './layouts/cms-layout.component';
import { authGuard } from './core/guards/guards';

import { homeRoutes } from './modules/home/home.routes';
import { newsPublicRoutes, newsCmsRoutes } from './modules/news/news.routes';
import { articlePublicRoutes, articleCmsRoutes } from './modules/article/article.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { roleRoutes } from './modules/role/role.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';

/**
 * Rute aplikasi disusun per modul (lihat `modules/<nama>/<nama>.routes.ts`)
 * lalu diagregasikan di sini di bawah 3 layout shell: publik, autentikasi, CMS.
 *
 * Tentang & Kontak tidak lagi punya rute sendiri — kontennya digabung sebagai
 * bagian dari Beranda (lihat modules/home), diakses lewat anchor #tentang / #kontak.
 */
export const routes: Routes = [
  // ---------- Publik (Landing Page) ----------
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      ...homeRoutes(),
      ...newsPublicRoutes(),
      ...articlePublicRoutes(),
    ],
  },

  // ---------- Autentikasi ----------
  {
    path: '',
    component: AuthLayoutComponent,
    children: [...authRoutes()],
  },

  // ---------- CMS (terproteksi) ----------
  {
    path: 'cms',
    component: CmsLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      ...dashboardRoutes(),
      ...userRoutes(),
      ...roleRoutes(),
      ...newsCmsRoutes(),
      ...articleCmsRoutes(),
    ],
  },

  { path: '**', redirectTo: '' },
];
