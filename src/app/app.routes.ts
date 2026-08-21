import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { CmsLayoutComponent } from './layouts/cms-layout.component';
import { authGuard } from './core/guards/guards';

import { homeRoutes } from './modules/home/home.routes';
import { newsPublicRoutes, newsCmsRoutes } from './modules/news/news.routes';
import { articlePublicRoutes, articleCmsRoutes } from './modules/article/article.routes';
import { eventPublicRoutes, eventCmsRoutes } from './modules/event/event.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { roleRoutes } from './modules/role/role.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { shortlinkRoutes, shortlinkPublicRoutes, shortlinkRedirectRoutes } from './modules/shortlink/shortlink.routes';
import { commentCmsRoutes } from './modules/comment/comment.routes';
import { settingRoutes } from './modules/setting/setting.routes';
import { jobqueueRoutes } from './modules/jobqueue/jobqueue.routes';

/**
 * Rute aplikasi disusun per modul (lihat `modules/<nama>/<nama>.routes.ts`)
 * lalu diagregasikan di sini di bawah 2 layout shell: publik (termasuk
 * autentikasi, bersarang di dalamnya) dan CMS.
 *
 * Halaman autentikasi (login/daftar/dll) sengaja dipasang sebagai anak dari
 * PublicLayoutComponent, bukan shell terpisah â€” persis pola ldksyahid-app
 * (halaman auth memakai navbar & footer landing page yang sama) karena
 * halaman ini diperuntukkan bagi masyarakat umum, bukan hanya pengguna CMS.
 * AuthLayoutComponent kini hanya membingkai kartu form + panel visual.
 *
 * Tentang tidak lagi punya rute sendiri â€” kontennya digabung sebagai bagian
 * dari Beranda (lihat modules/home), diakses lewat anchor #tentang. Kontak
 * juga tidak punya section sendiri lagi â€” akun media sosial dipindah ke footer.
 *
 * shortlinkRedirectRoutes() (path `:key`) WAJIB ditaruh setelah seluruh rute
 * bernama (publik/auth/cms) dan sebelum wildcard `**` â€” ia menangkap path
 * satu-segmen yang tidak cocok rute mana pun (mis. /promo2026) sebagai kunci
 * shortlink untuk di-resolve & redirect. Karena Angular mencocokkan array
 * rute secara berurutan, urutan ini mencegah /login, /berita, dst. malah
 * tertangkap sebagai shortlink.
 */
export const routes: Routes = [
  // ---------- Publik (Landing Page + Autentikasi) ----------
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      ...homeRoutes(),
      ...newsPublicRoutes(),
      ...articlePublicRoutes(),
      ...eventPublicRoutes(),
      ...shortlinkPublicRoutes(),
      { path: '', component: AuthLayoutComponent, children: [...authRoutes()] },
    ],
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
      ...eventCmsRoutes(),
      ...shortlinkRoutes(),
      ...commentCmsRoutes(),
      ...settingRoutes(),
      ...jobqueueRoutes(),
    ],
  },

  ...shortlinkRedirectRoutes(),

  { path: '**', redirectTo: '' },
];
