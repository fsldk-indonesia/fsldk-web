import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { CmsLayoutComponent } from './layouts/cms-layout.component';
import { KaderLayoutComponent } from './layouts/kader-layout.component';
import { authGuard, verifiedGuard } from './core/guards/guards';

import { homeRoutes } from './modules/home/home.routes';
import { newsPublicRoutes, newsCmsRoutes } from './modules/news/news.routes';
import { articlePublicRoutes, articleCmsRoutes } from './modules/article/article.routes';
import { eventPublicRoutes, eventCmsRoutes } from './modules/event/event.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { roleRoutes } from './modules/role/role.routes';
import { organizationRoutes } from './modules/organization/organization.routes';
import { submissionFormRoutes } from './modules/submission-form/submission-form.routes';
import { submissionRoutes } from './modules/submission/submission.routes';
import { reportRoutes } from './modules/report/report.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { shortlinkRoutes, shortlinkRedirectRoutes } from './modules/shortlink/shortlink.routes';
import { kaderRoutes } from './modules/submission/kader.routes';
import { commentCmsRoutes } from './modules/comment/comment.routes';

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
      { path: '', component: AuthLayoutComponent, children: [...authRoutes()] },
      // Profil Saya — dipisah dari Portal Kader (sebelumnya /kader/profil,
      // jadi tidak bisa diakses akun non-Kader sama sekali karena link
      // menuju Portal Kader hanya muncul untuk akun Kader) supaya SEMUA akun
      // login (CMS staff maupun Kader) punya jalur ke halaman ini — lihat
      // site-header.component.ts & cms-layout.component.ts (dropdown akun)
      // dan kader-layout.component.ts (sidebar Portal Kader, link diarahkan
      // ke sini juga, bukan didup dua rute untuk halaman yang sama).
      {
        path: 'akun/profil',
        canActivate: [verifiedGuard],
        loadComponent: () => import('./modules/user/pages/my-profile/user.my-profile.page').then((m) => m.UserMyProfilePage),
      },
    ],
  },

  // ---------- CMS (terproteksi) ----------
  // 4 shell terpisah (miss-development-clarification.md poin 1-4): CMS Utama
  // (FSLDK, tema default) + 3 CMS ber-tier (LDK/Puskomda/Puskomnas, tema &
  // org-switcher lokal sendiri-sendiri — lihat CmsLayoutComponent). Menu
  // sidebar tiap shell difilter dari /me/menus berdasarkan prefix route ini
  // (lk_permission.menuRoute sudah di-set per shell lewat migration 0010),
  // jadi array child routes di bawah boleh dipakai bersama lintas shell
  // (mis. dashboardRoutes()) tanpa perlu 4 salinan *.routes.ts — akses tetap
  // dijaga permissionGuard per halaman, bukan oleh shell mana yang dipakai.
  {
    path: 'cms',
    component: CmsLayoutComponent,
    canActivate: [authGuard],
    data: { tier: 'FSLDK' },
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
    ],
  },
  {
    path: 'cms-ldk',
    component: CmsLayoutComponent,
    canActivate: [authGuard],
    data: { tier: 'LDK' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      ...dashboardRoutes(),
      ...organizationRoutes(),
      ...submissionRoutes(),
    ],
  },
  {
    path: 'cms-puskomda',
    component: CmsLayoutComponent,
    canActivate: [authGuard],
    data: { tier: 'PUSKOMDA' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      ...dashboardRoutes(),
      ...organizationRoutes(),
      ...submissionRoutes(),
      ...reportRoutes(),
    ],
  },
  {
    path: 'cms-puskomnas',
    component: CmsLayoutComponent,
    canActivate: [authGuard],
    data: { tier: 'PUSKOMNAS' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      ...dashboardRoutes(),
      ...organizationRoutes(),
      ...submissionRoutes(),
      ...reportRoutes(),
      ...submissionFormRoutes(),
    ],
  },

  // ---------- Kader (self-service, tema landing page + sidebar ringkas) ----------
  {
    path: 'kader',
    component: KaderLayoutComponent,
    canActivate: [authGuard],
    children: [...kaderRoutes()],
  },

  ...shortlinkRedirectRoutes(),

  { path: '**', redirectTo: '' },
];
