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
import { shortlinkRoutes, shortlinkRedirectRoutes } from './modules/shortlink/shortlink.routes';

/**
 * Rute aplikasi disusun per modul (lihat `modules/<nama>/<nama>.routes.ts`)
 * lalu diagregasikan di sini di bawah 3 layout shell: publik, autentikasi, CMS.
 *
 * Tentang & Kontak tidak lagi punya rute sendiri — kontennya digabung sebagai
 * bagian dari Beranda (lihat modules/home), diakses lewat anchor #tentang / #kontak.
 *
 * shortlinkRedirectRoutes() (path `:key`) WAJIB ditaruh setelah seluruh rute
 * bernama (publik/auth/cms) dan sebelum wildcard `**` — ia menangkap path
 * satu-segmen yang tidak cocok rute mana pun (mis. /promo2026) sebagai kunci
 * shortlink untuk di-resolve & redirect. Karena Angular mencocokkan array
 * rute secara berurutan, urutan ini mencegah /login, /berita, dst. malah
 * tertangkap sebagai shortlink.
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
      ...shortlinkRoutes(),
    ],
  },

  ...shortlinkRedirectRoutes(),

  { path: '**', redirectTo: '' },
];
