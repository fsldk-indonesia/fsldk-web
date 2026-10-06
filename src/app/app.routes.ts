import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { FormLayoutComponent } from './layouts/form-layout.component';
import { KantongAmalDonationFlowLayoutComponent } from './layouts/kantong-amal-donation-flow-layout.component';
import { CmsLayoutComponent } from './layouts/cms-layout.component';
import { KaderLayoutComponent } from './layouts/kader-layout.component';
import { authGuard } from './core/guards/guards';
import { RapimnasLayoutComponent } from './layouts/rapimnas/rapimnas-layout.component';
import { rapimnasPublicRoutes, rapimnasCmsRoutes } from './modules/rapimnas/rapimnas.routes';

import { homeRoutes } from './modules/home/home.routes';
import { newsPublicRoutes, newsCmsRoutes } from './modules/news/news.routes';
import { articlePublicRoutes, articleCmsRoutes } from './modules/article/article.routes';
import { catalogbookPublicRoutes, catalogbookCmsRoutes } from './modules/catalogbook/catalogbook.routes';
import { dynamicFormPublicRoutes, dynamicFormCmsRoutes } from './modules/dynamicform/dynamicform.routes';
import { goodsPublicRoutes, goodsCmsRoutes, goodsCategoryCmsRoutes } from './modules/goods/goods.routes';
import { schedulePublicRoutes, scheduleCmsRoutes } from './modules/schedule/schedule.routes';
import { financeformatPublicRoutes, financeformatCmsRoutes } from './modules/financeformat/financeformat.routes';
import { eventPublicRoutes, eventCmsRoutes } from './modules/event/event.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { roleRoutes } from './modules/role/role.routes';
import { organizationRoutes } from './modules/organization/organization.routes';
import { submissionFormRoutes } from './modules/submission-form/submission-form.routes';
import { submissionRoutes } from './modules/submission/submission.routes';
import { reportRoutes } from './modules/report/report.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { shortlinkRoutes, shortlinkPublicRoutes, shortlinkRedirectRoutes } from './modules/shortlink/shortlink.routes';
import { qrcodeRoutes, qrcodePublicRoutes, qrcodeDetailRoutes } from './modules/qrcode/qrcode.routes';
import { kantongAmalPublicRoutes, kantongAmalDonationFlowRoutes, kantongAmalAdminRoutes } from './modules/kantong-amal/kantong-amal.routes';
import { zakatPublicRoutes } from './modules/zakat/zakat.routes';
import { kaderRoutes } from './modules/submission/kader.routes';
import { commentCmsRoutes } from './modules/comment/comment.routes';
import { settingRoutes } from './modules/setting/setting.routes';
import { welcomepopupRoutes } from './modules/welcomepopup/welcomepopup.routes';
import { jobqueueRoutes } from './modules/jobqueue/jobqueue.routes';
import { structurePublicRoutes, structureCmsRoutes } from './modules/structure/structure.routes';
import { galleryPublicRoutes, galleryCmsRoutes } from './modules/gallery/gallery.routes';
import { contactPublicRoutes, contactCmsRoutes } from './modules/contact/contact.routes';
import { subscriptionPublicRoutes, subscriptionCmsRoutes } from './modules/subscription/subscription.routes';
import { statisticPublicRoutes } from './modules/statistic/statistic.routes';

/**
 * Rute aplikasi disusun per modul (lihat `modules/<nama>/<nama>.routes.ts`)
 * lalu diagregasikan di sini di bawah 2 layout shell: publik (termasuk
 * autentikasi, bersarang di dalamnya) dan CMS.
 *
 * Halaman autentikasi (login/daftar/dll) dipasang sebagai shell SENDIRI
 * (AuthLayoutComponent), BUKAN lagi anak dari PublicLayoutComponent — tanpa
 * navbar/footer/WhatsApp FAB landing page, cuma kartu form di atas backdrop
 * hero gelap (lihat AuthLayoutComponent). Jalan keluarnya adalah tombol
 * "Kembali ke Beranda" di dalam kartu itu sendiri, bukan navbar.
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
      ...catalogbookPublicRoutes(),
      ...goodsPublicRoutes(),
      ...schedulePublicRoutes(),
      ...financeformatPublicRoutes(),
      ...eventPublicRoutes(),
      ...kantongAmalPublicRoutes(),
      ...shortlinkPublicRoutes(),
      ...qrcodePublicRoutes(),
      ...zakatPublicRoutes(),
      ...structurePublicRoutes(),
      ...galleryPublicRoutes(),
      ...contactPublicRoutes(),
      ...subscriptionPublicRoutes(),
      ...statisticPublicRoutes(),
      // Profil Saya — dipisah dari Portal Kader (sebelumnya /kader/profil,
      // jadi tidak bisa diakses akun non-Kader sama sekali karena link
      // menuju Portal Kader hanya muncul untuk akun Kader) supaya SEMUA akun
      // login (CMS staff maupun Kader) punya jalur ke halaman ini — lihat
      // site-header.component.ts & cms-layout.component.ts (dropdown akun)
      // dan kader-layout.component.ts (sidebar Portal Kader, link diarahkan
      // ke sini juga, bukan didup dua rute untuk halaman yang sama).
      {
        path: 'akun/profil',
        title: 'Profil Saya',
        loadComponent: () => import('./modules/user/pages/my-profile/user.my-profile.page').then((m) => m.UserMyProfilePage),
      },
    ],
  },

  // ---------- Autentikasi (shell sendiri, TANPA navbar/footer landing page) ----------
  { path: '', component: AuthLayoutComponent, children: [...authRoutes()] },

  // ---------- Formulir Dinamis publik (shell sendiri, TANPA navbar/footer — lihat FormLayoutComponent) ----------
  { path: '', component: FormLayoutComponent, children: [...dynamicFormPublicRoutes()] },

  // ---------- Alur Donasi Kantong Amal (shell sendiri, TANPA navbar/footer — lihat KantongAmalDonationFlowLayoutComponent) ----------
  { path: '', component: KantongAmalDonationFlowLayoutComponent, children: [...kantongAmalDonationFlowRoutes()] },

  // ---------- Detail QR Code (tanpa shell — halaman sendiri yang memikul backdrop penuh-layar, TANPA navbar/footer) ----------
  ...qrcodeDetailRoutes(),

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
      ...catalogbookCmsRoutes(),
      ...dynamicFormCmsRoutes(),
      ...goodsCmsRoutes(),
      ...goodsCategoryCmsRoutes(),
      ...scheduleCmsRoutes(),
      ...financeformatCmsRoutes(),
      ...eventCmsRoutes(),
      ...shortlinkRoutes(),
      ...qrcodeRoutes(),
      ...commentCmsRoutes(),
      ...settingRoutes(),
      ...welcomepopupRoutes(),
      ...jobqueueRoutes(),
      ...structureCmsRoutes(),
      ...galleryCmsRoutes(),
      ...kantongAmalAdminRoutes(),
      ...contactCmsRoutes(),
      ...subscriptionCmsRoutes(),
      ...rapimnasCmsRoutes(),
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

  // ---------- Rapimnas (shell sendiri — lihat RapimnasLayoutComponent).
  // SEMENTARA hanya route Beranda; rapimnasPublicRoutes() akan bertambah
  // seiring halaman lain selesai, lihat rapimnas.routes.ts ----------
  {
    path: 'rapimnas',
    component: RapimnasLayoutComponent,
    children: [...rapimnasPublicRoutes()],
  },

  ...shortlinkRedirectRoutes(),

  { path: '**', redirectTo: '' },
];
