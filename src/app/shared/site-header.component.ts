import { Component, HostListener, NgZone, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { SubmissionRepository } from '../modules/submission/repositories/submission.repository';
import { FORM_CODE_SENSUS_KADER } from '../modules/submission/entities/submission';
import { shortlinkPath } from '../modules/shortlink/shortlink.path';
import { qrcodePath } from '../modules/qrcode/qrcode.path';
import { financeformatPath } from '../modules/financeformat/financeformat.path';
import { zakatPath } from '../modules/zakat/zakat.path';
import { schedulePath } from '../modules/schedule/schedule.path';
import { goodsPath } from '../modules/goods/goods.path';
import { CmsTier, CMS_SHELL_BASE, CMS_SHELL_LABEL, CMS_SHELL_ICON } from './cms-tier';
import { IconComponent } from './icon.component';
import { PrayerTimeComponent } from './prayer-time.component';

const KADER_PENDING_STATUSES = ['SUBMITTED', 'LDK_REVIEW', 'REVISION_REQUESTED_LDK'];

// Sama persis dengan TIER_COLOR/TIER_CAPTION di cms-layout.component.ts —
// dropdown akun navbar publik menampilkan tier yang sama, jadi warna & teks
// deskripsinya disamakan (bukan generik "Akses panel pengelolaan situs").
const TIER_COLOR: Record<CmsTier, string> = {
  FSLDK: '#00933b', PUSKOMNAS: '#55408f', PUSKOMDA: '#186541', LDK: '#063c84',
};
const TIER_CAPTION: Record<CmsTier, string> = {
  FSLDK: 'Kelola seluruh konten & pengguna sistem',
  PUSKOMNAS: 'Verifikasi & penetapan level nasional',
  PUSKOMDA: 'Verifikasi & pendataan wilayah',
  LDK: 'Kelola pendataan & kader LDK Anda',
};

/**
 * Navbar landing page — dipakai APA ADANYA (bukan varian/tema lain) di
 * PublicLayoutComponent maupun KaderLayoutComponent (miss-development-
 * prompt-2.md poin 4: navbar & footer Portal Kader harus identik dengan
 * landing page, bedanya cuma ada sidebar). Sepenuhnya mandiri (baca
 * AuthRepository sendiri) supaya bisa dipasang di layout manapun tanpa
 * wiring tambahan dari parent.
 */
@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, PrayerTimeComponent],
  template: `
    <div class="nav-placeholder" [class.active]="scrolled()"></div>
    <header class="pub-header" [class.scrolled]="scrolled()">
      <div class="container flex items-center justify-between">
        <a routerLink="/" class="brand" (click)="closeMobile()">
          <span class="brand-logo-wrap">
            <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia" class="brand-logo-img">
            <span class="brand-sparkle" aria-hidden="true">💫</span>
          </span>
          <span class="brand-text">FSLDK <b>Indonesia</b></span>
        </a>

        <div class="pub-nav-group">
          <nav class="pub-nav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Beranda</a>
            <div class="nav-dropdown-wrap" (mouseenter)="openTentangKamiMenu()" (mouseleave)="closeTentangKamiMenu()">
              <button type="button" class="nav-dropdown-trigger" [class.active]="isTentangKamiActive()" (click)="toggleTentangKamiMenu($event)">
                Tentang Kami <app-icon name="chevron-down" [size]="12" />
              </button>
              <div class="nav-dropdown-panel two-col" [class.open]="tentangKamiMenuOpen()">
                @for (item of tentangKamiItems; track item.href) {
                  <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeTentangKamiMenu()">
                    <span class="icon-badge sm icon-badge-solid"><app-icon [name]="item.icon" [size]="15" /></span>
                    <span class="nav-dropdown-item-text">
                      <span class="nav-dropdown-item-title">{{ item.title }}</span>
                      <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
                    </span>
                  </a>
                }
              </div>
            </div>
            <a routerLink="/berita" routerLinkActive="active">Berita</a>
            <a routerLink="/artikel" routerLinkActive="active">Artikel</a>
            <a routerLink="/perpustakaan" routerLinkActive="active">Perpustakaan</a>
            <a routerLink="/event" routerLinkActive="active">Event</a>
          </nav>
          <div class="nav-dropdown-wrap" (mouseenter)="openLainnyaMenu()" (mouseleave)="closeLainnyaMenu()">
            <button type="button" class="nav-dropdown-trigger" [class.active]="isLainnyaActive()" (click)="toggleLainnyaMenu($event)">
              Layanan <app-icon name="chevron-down" [size]="12" />
            </button>
            <div class="nav-dropdown-panel two-col" [class.open]="lainnyaMenuOpen()">
              @for (item of lainnyaItems; track item.href) {
                <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeLainnyaMenu()">
                  <span class="icon-badge sm icon-badge-solid"><app-icon [name]="item.icon" [size]="15" /></span>
                  <span class="nav-dropdown-item-text">
                    <span class="nav-dropdown-item-title">{{ item.title }}</span>
                    <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
                  </span>
                </a>
              }
            </div>
          </div>
          <div class="nav-dropdown-wrap" (mouseenter)="openMoreMenu()" (mouseleave)="closeMoreMenu()">
            <button type="button" class="nav-dropdown-trigger" [class.active]="isMoreActive()" (click)="toggleMoreMenu($event)">
              Lainnya <app-icon name="chevron-down" [size]="12" />
            </button>
            <div class="nav-dropdown-panel" [class.open]="moreMenuOpen()">
              @for (item of moreItems; track item.href) {
                <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeMoreMenu()">
                  <span class="icon-badge sm icon-badge-solid"><app-icon [name]="item.icon" [size]="15" /></span>
                  <span class="nav-dropdown-item-text">
                    <span class="nav-dropdown-item-title">{{ item.title }}</span>
                    <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
                  </span>
                </a>
              }
            </div>
          </div>
        </div>

        <div class="topbar-end">
        <div class="topbar-prayer">
          <app-prayer-time />
        </div>

        <div class="flex items-center gap-sm pub-actions">
          @if (auth.isLoggedIn()) {
            <div class="user-fun-wrap" (mouseenter)="openUserMenu()" (mouseleave)="closeUserMenu()">
              <button class="btn btn-sm btn-user-fun account-chip" type="button" (click)="toggleUserMenu($event)">
                @if (auth.user()?.photoURL) {
                  <img class="chip-avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
                } @else {
                  <span class="chip-avatar">{{ initials() }}</span>
                }
                {{ auth.user()?.fullName }}
              </button>
              <div class="dropdown-fun" [class.open]="userMenuOpen()">
                @for (t of auth.accessibleCmsTiers(); track t) {
                  <a [routerLink]="shellBase(t) + '/dashboard'" class="dropdown-fun-item portal-item" (click)="closeUserMenu()"
                     [style.--tier-color]="tierColorOf(t)" [style.--tier-soft]="tierTintOf(t)">
                    <span class="icon-badge sm" [style.background]="tierColorOf(t)" style="color:#fff"><app-icon [name]="shellIcon(t)" [size]="15" /></span>
                    <span class="nav-dropdown-item-text">
                      <span class="nav-dropdown-item-title portal-title">{{ shellLabel(t) }}</span>
                      <span class="nav-dropdown-item-caption">{{ tierCaptionOf(t) }}</span>
                    </span>
                  </a>
                }
                @if (auth.isKaderSelfService()) {
                  <a [routerLink]="kaderNavLink()" routerLinkActive="active" class="dropdown-fun-item" (click)="closeUserMenu()">
                    <span class="icon-badge sm icon-badge-soft"><app-icon name="id-card" [size]="15" /></span>
                    <span class="nav-dropdown-item-text">
                      <span class="nav-dropdown-item-title">{{ kaderNavLabel() }}</span>
                      <span class="nav-dropdown-item-caption">Pendataan &amp; status keanggotaan kader</span>
                    </span>
                  </a>
                }
                <a routerLink="/akun/profil" routerLinkActive="active" class="dropdown-fun-item" (click)="closeUserMenu()">
                  <span class="icon-badge sm icon-badge-solid"><app-icon name="user-circle" [size]="15" /></span>
                  <span class="nav-dropdown-item-text">
                    <span class="nav-dropdown-item-title">Profil Saya</span>
                    <span class="nav-dropdown-item-caption">Lihat &amp; ubah profil Anda</span>
                  </span>
                </a>
                <button type="button" class="dropdown-fun-item dropdown-divider-top" (click)="logout()">
                  <span class="icon-badge sm icon-badge-danger"><app-icon name="log-out" [size]="15" /></span>
                  <span class="nav-dropdown-item-text">
                    <span class="nav-dropdown-item-title">Keluar</span>
                    <span class="nav-dropdown-item-caption">Keluar dari akun Anda</span>
                  </span>
                </button>
              </div>
            </div>
          } @else {
            <div class="user-fun-wrap" (mouseenter)="openUserMenu()" (mouseleave)="closeUserMenu()">
              <button class="btn btn-sm btn-user-fun account-chip" type="button" (click)="toggleUserMenu($event)">
                <span class="chip-avatar guest"><app-icon name="guest" [size]="15" /></span> Pengunjung
              </button>
              <div class="dropdown-fun" [class.open]="userMenuOpen()">
                <a routerLink="/login" routerLinkActive="active" class="dropdown-fun-item" (click)="closeUserMenu()">
                  <span class="icon-badge sm icon-badge-solid"><app-icon name="log-in" [size]="15" /></span>
                  <span class="nav-dropdown-item-text">
                    <span class="nav-dropdown-item-title">Masuk</span>
                    <span class="nav-dropdown-item-caption">Login ke akun kamu</span>
                  </span>
                </a>
                <a routerLink="/daftar" routerLinkActive="active" class="dropdown-fun-item" (click)="closeUserMenu()">
                  <span class="icon-badge sm icon-badge-solid"><app-icon name="user-plus" [size]="15" /></span>
                  <span class="nav-dropdown-item-text">
                    <span class="nav-dropdown-item-title">Daftar</span>
                    <span class="nav-dropdown-item-caption">Buat akun baru</span>
                  </span>
                </a>
              </div>
            </div>
          }
        </div>
        </div>

        <button class="mobile-toggle" [class.active]="mobileOpen()" (click)="toggleMobile()" aria-label="Buka menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>

    <div class="mobile-overlay" [class.active]="mobileOpen()" (click)="closeMobile()"></div>
    <aside class="mobile-drawer" [class.active]="mobileOpen()">
      <div class="mobile-drawer-head">
        <a routerLink="/" class="brand" (click)="closeMobile()">
          <span class="brand-logo-wrap">
            <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia" class="brand-logo-img sm">
            <span class="brand-sparkle" aria-hidden="true">🍃</span>
          </span>
          <span class="brand-text">FSLDK <b>Indonesia</b></span>
        </a>
        <button class="mobile-close" (click)="closeMobile()" aria-label="Tutup menu">&times;</button>
      </div>
      @if (auth.isLoggedIn()) {
        <div class="mobile-account">
          @if (auth.user()?.photoURL) {
            <img class="chip-avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
          } @else {
            <span class="chip-avatar">{{ initials() }}</span>
          }
          {{ auth.user()?.fullName }}
        </div>
      } @else {
        <div class="mobile-account"><span class="chip-avatar guest"><app-icon name="guest" [size]="15" /></span> Pengunjung</div>
      }

      <nav class="mobile-nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMobile()">
          <span class="mobile-nav-icon"><app-icon name="home" [size]="15" /></span>Beranda
        </a>

        <div class="mobile-dropdown" [class.open]="mobileTentangOpen()">
          <button type="button" class="mobile-dropdown-toggle" (click)="toggleMobileTentang()">
            <span class="mobile-nav-icon"><app-icon name="info" [size]="15" /></span>
            <span>Tentang Kami</span>
            <app-icon name="chevron-down" [size]="12" class="mobile-dropdown-arrow" />
          </button>
          <div class="mobile-dropdown-panel">
            @for (item of tentangKamiItems; track item.href) {
              <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeMobile()">
                <span class="icon-badge sm icon-badge-solid"><app-icon [name]="item.icon" [size]="15" /></span>
                <span class="nav-dropdown-item-text">
                  <span class="nav-dropdown-item-title">{{ item.title }}</span>
                  <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
                </span>
              </a>
            }
          </div>
        </div>

        <a routerLink="/berita" routerLinkActive="active" (click)="closeMobile()">
          <span class="mobile-nav-icon"><app-icon name="megaphone" [size]="15" /></span>Berita
        </a>
        <a routerLink="/artikel" routerLinkActive="active" (click)="closeMobile()">
          <span class="mobile-nav-icon"><app-icon name="file-text" [size]="15" /></span>Artikel
        </a>
        <a routerLink="/perpustakaan" routerLinkActive="active" (click)="closeMobile()">
          <span class="mobile-nav-icon"><app-icon name="book-open" [size]="15" /></span>Perpustakaan
        </a>
        <a routerLink="/event" routerLinkActive="active" (click)="closeMobile()">
          <span class="mobile-nav-icon"><app-icon name="calendar-days" [size]="15" /></span>Event
        </a>

        <div class="mobile-dropdown" [class.open]="mobileLayananOpen()">
          <button type="button" class="mobile-dropdown-toggle" (click)="toggleMobileLayanan()">
            <span class="mobile-nav-icon"><app-icon name="wrench" [size]="15" /></span>
            <span>Layanan</span>
            <app-icon name="chevron-down" [size]="12" class="mobile-dropdown-arrow" />
          </button>
          <div class="mobile-dropdown-panel">
            @for (item of lainnyaItems; track item.href) {
              <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeMobile()">
                <span class="icon-badge sm icon-badge-solid"><app-icon [name]="item.icon" [size]="15" /></span>
                <span class="nav-dropdown-item-text">
                  <span class="nav-dropdown-item-title">{{ item.title }}</span>
                  <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
                </span>
              </a>
            }
          </div>
        </div>
      </nav>
      <div class="mobile-nav-extra">
        <span class="mobile-nav-label">Lainnya</span>
        @for (item of moreItems; track item.href) {
          <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeMobile()">
            <span class="icon-badge sm icon-badge-solid"><app-icon [name]="item.icon" [size]="15" /></span>
            <span class="nav-dropdown-item-text">
              <span class="nav-dropdown-item-title">{{ item.title }}</span>
              <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
            </span>
          </a>
        }
      </div>
      <div class="mobile-actions">
        @if (auth.isLoggedIn()) {
          @for (t of auth.accessibleCmsTiers(); track t) {
            <a [routerLink]="shellBase(t) + '/dashboard'" class="btn btn-outline btn-block" (click)="closeMobile()"><app-icon [name]="shellIcon(t)" [size]="17" />{{ shellLabel(t) }}</a>
          }
          @if (auth.isKaderSelfService()) {
            <a [routerLink]="kaderNavLink()" class="btn btn-primary btn-block" (click)="closeMobile()"><app-icon name="id-card" [size]="17" />{{ kaderNavLabel() }}</a>
          }
          <a routerLink="/akun/profil" class="btn btn-outline btn-block" (click)="closeMobile()"><app-icon name="user-circle" [size]="17" />Profil Saya</a>
          <button type="button" class="btn btn-outline btn-block" (click)="logout(); closeMobile()"><app-icon name="log-out" [size]="17" />Keluar</button>
        } @else {
          <a routerLink="/login" class="btn btn-outline btn-block" (click)="closeMobile()"><app-icon name="log-in" [size]="17" />Masuk</a>
          <a routerLink="/daftar" class="btn btn-primary btn-block" (click)="closeMobile()"><app-icon name="user-plus" [size]="17" />Daftar</a>
        }
      </div>
    </aside>
  `,
  styles: [`
    :host { display: contents; }
    .nav-placeholder { height: 0; transition: height .2s ease; }
    .nav-placeholder.active { height: 78px; }

    .pub-header { position: relative; top: 0; left: 0; width: 100%; z-index: 60; background: rgba(255,255,255,.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,.4); padding: 16px 0; }
    /* Navbar sengaja lebih lebar dari .container standar (1180px dipakai
       semua section konten lain) — mengikuti pola ldksyahid-app yang
       navbar-nya terasa lega dan hampir penuh lebar layar, bukan sekadar
       sejajar dengan lebar konten. gap eksplisit menjaga jarak minimum
       antar 3 grup (brand/menu/aksi) tetap ada meski justify-between
       kehabisan sisa ruang di viewport laptop yang lebih sempit. */
    .pub-header .container { max-width: 1600px; gap: 32px; padding: 0 50px; }
    .pub-header.scrolled {
      position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
      width: min(1300px, calc(100% - 120px));
      border: 1px solid var(--color-border); border-radius: 12px;
      box-shadow: var(--shadow-lg); background: #fff; padding: 8px 20px;
      animation: navFadeIn .25s ease;
    }
    /* .container punya padding 0 50px sebagai default (lebar penuh, lihat
       komentar di atas) — pas .scrolled jadi pill mengambang yang lebih
       sempit, padding itu numpuk dengan padding header sendiri (8px 20px)
       dan menyisakan spasi kosong besar sebelum logo. Nolkan di sini,
       inset-nya cukup dari padding header saja. */
    .pub-header.scrolled .container { padding: 0; }
    @keyframes navFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

    .brand { display: flex; align-items: center; gap: 12px; margin-right: 16px; flex-shrink: 0; }
    .brand:hover { text-decoration: none; }
    .brand-logo-wrap { position: relative; display: inline-flex; flex-shrink: 0; }
    .brand-logo-img { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1px solid var(--color-border); flex-shrink: 0; transition: transform .2s ease; }
    .brand:hover .brand-logo-img { transform: rotate(-4deg) scale(1.04); }
    .brand-logo-img.sm { width: 36px; height: 36px; }
    .brand-sparkle { position: absolute; top: -6px; right: -6px; font-size: .95rem; line-height: 1; animation: brand-sparkle 2s ease-in-out infinite; }
    @keyframes brand-sparkle { 0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; } 50% { transform: scale(1.2) rotate(15deg); opacity: .8; } }
    @media (prefers-reduced-motion: reduce) { .brand-sparkle { animation: none; } }
    .brand-text { font-family: var(--font-heading); font-weight: 700; font-size: 1.05rem; display: flex; flex-direction: column; line-height: 1.1; white-space: nowrap; }
    .brand-text b { color: var(--color-primary); display: inline; }

    .pub-nav-group { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .pub-nav { display: flex; align-items: center; gap: 4px; }
    .mobile-nav a { position: relative; display: flex; align-items: center; gap: 7px; color: var(--color-text); font-weight: 600; transition: color var(--motion-fast) ease; }
    .pub-nav a svg, .mobile-nav a svg { opacity: .75; }
    .pub-nav a.active svg, .mobile-nav a.active svg { opacity: 1; }
    .mobile-nav a:hover { text-decoration: none; color: var(--color-primary-dark); }
    .pub-nav a {
      position: relative; display: flex; align-items: center; gap: 6px;
      padding: 8px 13px; border-radius: 12px; color: var(--color-text); font-weight: 600; font-size: .86rem;
      transition: color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
      white-space: nowrap;
    }
    .pub-nav a:hover { text-decoration: none; color: var(--color-primary-dark); background: var(--color-primary-soft); }
    .pub-nav a.active { color: #fff; background: var(--color-primary); box-shadow: 0 4px 12px rgba(0,147,59,.28); }
    .pub-nav a.active:hover { color: #fff; background: var(--color-primary-dark); }
    .pub-nav a:focus-visible, .mobile-nav a:focus-visible, .btn-user-fun:focus-visible, .mobile-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; border-radius: var(--radius-xs); }

    .user-fun-wrap { position: relative; }
    .btn-user-fun { border: none; cursor: pointer; font-family: var(--font-body); }
    /* linear-gradient() sebagai background TIDAK bisa di-transition mulus
       (background-image itu properti "discrete", bukan diinterpolasi kayak
       background-color) — walau .btn global sudah punya transition
       background, gradient-ke-gradient tetap "loncat" instan. Solusinya:
       gradient hover ditaruh di ::before terpisah yang di-crossfade lewat
       opacity (opacity BISA diinterpolasi mulus), bukan transisi background
       langsung. */
    .account-chip {
      position: relative;
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: #fff;
      box-shadow: 0 4px 14px rgba(0,147,59,.28);
      transition: transform .5s ease, box-shadow .5s ease, color .5s ease;
    }
    .account-chip::before {
      content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      opacity: 0; transition: opacity .5s ease;
    }
    .account-chip:hover { color: #fff; transform: translateY(-1px); }
    .account-chip:hover::before { opacity: 1; }
    @media (prefers-reduced-motion: reduce) { .account-chip::before { transition: none; } }
    .chip-avatar { width: 24px; height: 24px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; }
    .chip-avatar.guest { background: var(--color-bg-alt); color: var(--color-text-secondary); }
    .account-chip .chip-avatar { background: rgba(255,255,255,.3); color: #fff; }
    .account-chip .chip-avatar.guest { background: rgba(255,255,255,.25); color: #fff; }
    img.chip-avatar { object-fit: cover; }
    /* Foto profil (kadang PNG transparan, mis. logo FSLDK) butuh cincin putih
       SOLID (border), bukan tint transparan seperti varian teks/inisial di
       atas — kalau tidak, area transparan PNG-nya cuma menembus warna pill
       hijau di baliknya dan logo jadi menyatu tak terbaca dengan tombol. */
    .account-chip img.chip-avatar { width: 26px; height: 26px; border: 2px solid #fff; background: #fff; }
    .dropdown-fun {
      position: absolute; right: 0; top: 100%; margin-top: 8px; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 280px; padding: 8px;
      display: flex; flex-direction: column; gap: 3px;
      opacity: 0; visibility: hidden; transform-origin: top right; transform: scale(.85) translateY(-4px);
      transition: opacity var(--motion-base) var(--ease-out), transform var(--motion-base) var(--ease-out), visibility var(--motion-base);
      z-index: 70;
    }
    .dropdown-fun-item { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 8px 12px; border-radius: var(--radius-xs); border: none; background: none; color: var(--color-text); font-family: var(--font-body); white-space: nowrap; cursor: pointer; transition: background var(--motion-fast) ease; }
    .dropdown-fun-item:hover { background: var(--color-primary-soft); text-decoration: none; }
    .dropdown-fun-item:hover .nav-dropdown-item-title { color: var(--color-primary-dark); }
    /* Item halaman yang sedang dibuka (mis. "Profil Saya" saat di /akun/profil)
       ikut tersorot hijau — konsisten dengan gaya .nav-dropdown-item.active
       di dropdown Tentang Kami/Layanan, bukan warna tier (portal-item punya
       treatment sendiri di atas, ini untuk item non-tier seperti Profil/Kader). */
    .dropdown-fun-item.active { background: var(--color-primary); box-shadow: 0 4px 12px rgba(0,147,59,.28); }
    .dropdown-fun-item.active .nav-dropdown-item-title { color: #fff; }
    .dropdown-fun-item.active .nav-dropdown-item-caption { color: rgba(255,255,255,.8); }
    .dropdown-fun-item.active .icon-badge { background: rgba(255,255,255,.25); color: #fff; }
    .dropdown-fun-item.active:hover { background: var(--color-primary-dark); }
    /* Portal item (Admin/Puskomnas/Puskomda/LDK) — hover-nya ikut warna tier
       masing-masing (via custom property --tier-color/--tier-soft yang
       di-set inline per item), SAMA PERSIS dengan .portal-item di
       cms-layout.component.ts, bukan satu warna hijau generik untuk semua. */
    .portal-item:hover { background: var(--tier-soft, var(--color-bg-warm)); }
    .portal-item:hover .portal-title { color: var(--tier-color, var(--color-primary-dark)); }
    /* Garis pemisah sebelum "Keluar" — sama seperti .dropdown-divider-top di
       cms-layout.component.ts, dipisah dari aksi navigasi di atasnya karena
       ini aksi destruktif (keluar akun). */
    .dropdown-fun .dropdown-divider-top { border-top: 1px solid var(--color-border); margin-top: 5px; padding-top: 14px; }
    .dropdown-fun.open { opacity: 1; visibility: visible; transform: scale(1) translateY(0); }
    @media (prefers-reduced-motion: reduce) { .dropdown-fun { transition: opacity var(--motion-base) ease, visibility var(--motion-base); transform: none !important; } }
    .mobile-account { display: flex; align-items: center; gap: 10px; padding: 8px 4px; font-weight: 600; color: var(--color-text); }

    /* Dropdown item navbar "Lainnya" — sama idiom-nya dengan .dropdown-fun
       (hover desktop + toggle-click, ditutup lewat onDocumentClick), tapi
       item-nya dua-baris (ikon + judul + caption) sehingga perlu varian
       markup/style sendiri, bukan reuse .dropdown-fun-item yang satu-baris.
       Markup-nya SENGAJA ditaruh sebagai sibling dari nav.pub-nav /
       nav.mobile-nav (dibungkus .pub-nav-group di desktop), BUKAN anak di
       dalamnya — selector global .pub-nav a / .pub-nav a.active dan
       .mobile-nav a / .mobile-nav a.active menyasar SEMUA elemen <a>
       keturunan, jadi kalau <a class="nav-dropdown-item"> ada di dalam nav
       itu, ia ikut kena gaya pill hijau solid milik link nav biasa
       (spesifisitas .pub-nav a.active lebih tinggi dari .nav-dropdown-item
       sendiri) alih-alih gaya dua-baris di bawah ini. */
    .pub-actions { flex-shrink: 0; }
    .topbar-end { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .nav-dropdown-wrap { position: relative; }
    .nav-dropdown-trigger {
      display: flex; align-items: center; gap: 5px; margin: 0; appearance: none;
      padding: 8px 13px; border-radius: 12px; border: none; background: none; cursor: pointer;
      color: var(--color-text); font-weight: 600; font-size: .86rem; font-family: var(--font-body); line-height: normal;
      transition: color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
      white-space: nowrap;
    }
    .nav-dropdown-trigger:hover { color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); box-shadow: 0 4px 14px rgba(0,147,59,.28); }
    .nav-dropdown-trigger:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; border-radius: var(--radius-xs); }
    /* Trigger ikut solid hijau (persis .pub-nav a.active) saat salah satu
       opsi di dropdown-nya sedang jadi halaman aktif, bukan cuma opsi-nya
       sendiri di dalam panel — lihat isLainnyaActive(). */
    .nav-dropdown-trigger.active { color: #fff; background: var(--color-primary); box-shadow: 0 4px 12px rgba(0,147,59,.28); }
    .nav-dropdown-trigger.active:hover { color: #fff; background: var(--color-primary-dark); }
    .nav-dropdown-trigger app-icon { transition: transform var(--motion-fast) ease; }
    .nav-dropdown-wrap:has(.nav-dropdown-panel.open) .nav-dropdown-trigger app-icon { transform: rotate(180deg); }

    .nav-dropdown-panel {
      position: absolute; left: 0; top: 100%; margin-top: 8px; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-xs); box-shadow: var(--shadow-lg); min-width: 280px; padding: 14px;
      opacity: 0; visibility: hidden; transform-origin: top left; transform: scale(.85) translateY(-4px);
      transition: opacity var(--motion-base) var(--ease-out), transform var(--motion-base) var(--ease-out), visibility var(--motion-base);
      z-index: 70;
    }
    .nav-dropdown-panel.two-col { min-width: 480px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 8px; }
    .nav-dropdown-panel.open { opacity: 1; visibility: visible; transform: scale(1) translateY(0); }
    @media (prefers-reduced-motion: reduce) { .nav-dropdown-panel { transition: opacity var(--motion-base) ease, visibility var(--motion-base); transform: none !important; } }

    /* Style & interaksi disamakan persis dengan .dropdown-fun-item (list akun):
       hover netral (bg-warm, tanpa geser posisi), hijau HANYA untuk halaman
       yang sedang aktif — bukan hover=hijau seperti sebelumnya (yang bikin
       hover & active tidak bisa dibedakan). */
    .pub-nav a.nav-dropdown-item,
    .nav-dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-xs);
      color: var(--color-text);
      background: transparent;
      box-shadow: none;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .pub-nav a.nav-dropdown-item:hover,
    .nav-dropdown-item:hover {
      background: var(--color-primary-soft);
      text-decoration: none;
      box-shadow: none;
    }
    .pub-nav a.nav-dropdown-item:hover .nav-dropdown-item-title,
    .nav-dropdown-item:hover .nav-dropdown-item-title {
      color: var(--color-primary-dark);
    }
    .pub-nav a.nav-dropdown-item.active,
    .nav-dropdown-item.active {
      background: var(--color-primary);
      color: #fff;
      box-shadow: 0 4px 12px rgba(0,147,59,.28);
    }
    .pub-nav a.nav-dropdown-item.active:hover,
    .nav-dropdown-item.active:hover {
      background: var(--color-primary-dark);
      color: #fff;
      box-shadow: 0 4px 12px rgba(0,147,59,.28);
    }
    .pub-nav a.nav-dropdown-item.active .nav-dropdown-item-title,
    .nav-dropdown-item.active .nav-dropdown-item-title {
      color: #fff;
    }
    .pub-nav a.nav-dropdown-item.active .nav-dropdown-item-caption,
    .nav-dropdown-item.active .nav-dropdown-item-caption {
      color: rgba(255,255,255,.8);
    }
    .pub-nav a.nav-dropdown-item.active .icon-badge,
    .nav-dropdown-item.active .icon-badge {
      background: rgba(255,255,255,.25); color: #fff;
    }
    .nav-dropdown-item-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .nav-dropdown-item-title { font-weight: 700; font-size: .9rem; }
    .nav-dropdown-item-caption { font-size: .76rem; color: var(--color-muted); font-weight: 500; line-height: 1.3; }

    .mobile-nav-extra { display: flex; flex-direction: column; gap: 4px; padding: 0 12px 12px; }
    .mobile-nav-label { padding: 10px 14px 2px; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
    .mobile-nav-extra .nav-dropdown-item { padding: 10px 14px; }

    .mobile-toggle { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px; width: 40px; height: 40px; background: var(--color-primary-soft); border: none; border-radius: var(--radius-xs); cursor: pointer; padding: 0; }
    .mobile-toggle span { display: block; width: 18px; height: 2px; background: var(--color-primary-dark); border-radius: 2px; transition: transform .25s ease, opacity .25s ease; }
    .mobile-toggle.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .mobile-toggle.active span:nth-child(2) { opacity: 0; }
    .mobile-toggle.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .topbar-prayer { display: flex; flex-shrink: 0; }

    .mobile-overlay { position: fixed; inset: 0; background: rgba(20,23,26,.5); backdrop-filter: blur(2px); z-index: 90; opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility .25s ease; }
    .mobile-overlay.active { opacity: 1; visibility: visible; }
    .mobile-drawer { position: fixed; top: 0; right: -100%; width: 82%; max-width: 320px; height: 100vh; height: 100dvh; background: #fff; z-index: 100; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(20,23,26,.15); transition: right .35s cubic-bezier(.4,0,.2,1); }
    .mobile-drawer.active { right: 0; }
    .mobile-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--color-border); flex-shrink: 0; }
    .mobile-close { width: 34px; height: 34px; border-radius: var(--radius-xs); background: var(--color-primary-soft); color: var(--color-primary-dark); border: none; font-size: 1.3rem; line-height: 1; cursor: pointer; }
    .mobile-drawer .mobile-account { padding: 12px 18px; border-bottom: 1px solid var(--color-border); flex-shrink: 0; font-size: .88rem; }
    .mobile-drawer .mobile-account .chip-avatar { width: 32px; height: 32px; font-size: .8rem; }
    .mobile-drawer { overflow-y: auto; }
    .mobile-nav { display: flex; flex-direction: column; padding: 10px 12px; gap: 3px; }
    .mobile-nav a { padding: 11px 13px; border-radius: var(--radius-sm); font-size: .88rem; }
    .mobile-nav a.active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .mobile-nav-icon { width: 28px; height: 28px; border-radius: var(--radius-sm); background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mobile-nav a.active .mobile-nav-icon { background: var(--color-primary); color: #fff; }

    .mobile-dropdown-toggle {
      display: flex; align-items: center; gap: 7px; width: 100%; text-align: left; padding: 11px 13px;
      border-radius: var(--radius-sm); border: none; background: none; cursor: pointer;
      color: var(--color-text); font-weight: 600; font-size: .88rem; font-family: var(--font-body);
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .mobile-dropdown-toggle:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .mobile-dropdown-toggle span:nth-child(2) { flex: 1; }
    .mobile-dropdown-arrow { transition: transform var(--motion-fast) ease; opacity: .7; }
    .mobile-dropdown.open .mobile-dropdown-toggle { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .mobile-dropdown.open .mobile-dropdown-arrow { transform: rotate(180deg); }
    .mobile-dropdown-panel {
      max-height: 0; overflow: hidden; padding-left: 8px; margin-left: 22px; border-left: 2px solid var(--color-primary-soft);
      transition: max-height var(--motion-base) ease;
    }
    .mobile-dropdown.open .mobile-dropdown-panel { max-height: 480px; padding-top: 2px; padding-bottom: 4px; }
    .mobile-dropdown-panel .nav-dropdown-item { padding: 9px 10px; }
    @media (prefers-reduced-motion: reduce) { .mobile-dropdown-panel { transition: none; } }

    .mobile-actions { margin-top: auto; padding: 16px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }

    @media (max-width: 1080px) {
      .pub-nav-group, .pub-actions { display: none; }
      .mobile-toggle { display: flex; }
      .pub-header { padding: 12px 0; }
      .pub-header .container { padding: 0 30px; }
      .pub-header.scrolled { top: 10px; width: calc(100% - 24px); padding: 8px 14px; }
      .nav-placeholder.active { height: 64px; }
    }
  `],
})
export class SiteHeaderComponent implements OnInit, OnDestroy {
  auth = inject(AuthRepository);
  private submissionRepo = inject(SubmissionRepository);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private kaderSubmissionStatus = signal<string | null | undefined>(undefined);

  kaderNavLabel = computed(() => {
    const status = this.kaderSubmissionStatus();
    if (status === 'ACTIVE') return 'Portal Kader';
    if (status && KADER_PENDING_STATUSES.includes(status)) return 'Lihat Status Kader';
    return 'Daftar Kader';
  });
  kaderNavLink = computed(() => {
    const status = this.kaderSubmissionStatus();
    if (status === 'ACTIVE') return '/kader/ringkasan';
    if (status && KADER_PENDING_STATUSES.includes(status)) return '/kader/status';
    return '/kader/pendataan';
  });

  // Reaktif terhadap login/logout (bukan cuma ngOnInit sekali) — header ini
  // sering di-mount sekali per layout, jadi login yang terjadi TANPA reload
  // halaman (SPA) tetap perlu memicu ulang pengecekan status Sensus Kader.
  private readonly kaderStatusEffect = effect(() => {
    if (this.auth.isLoggedIn() && this.auth.isKaderSelfService()) {
      this.submissionRepo.findMine(FORM_CODE_SENSUS_KADER).subscribe({
        next: (sub) => this.kaderSubmissionStatus.set(sub?.status ?? null),
        error: () => this.kaderSubmissionStatus.set(null),
      });
    } else {
      this.kaderSubmissionStatus.set(undefined);
    }
  });

  /** Isi dropdown navbar "Tentang Kami" */
  readonly tentangKamiItems = [
    { icon: 'sitemap', title: 'Struktur Organisasi', caption: 'Kepengurusan FSLDK Indonesia', href: '/tentang/struktur' },
    { icon: 'photo', title: 'Galeri', caption: 'Dokumentasi kegiatan LDK', href: '/tentang/galeri' },
    { icon: 'file-bar-chart', title: 'Statistik Jaringan', caption: 'Data agregat LDK, Puskomda & Puskomnas', href: '/tentang/statistik-jaringan' },
    { icon: 'messages', title: 'Hubungi Kami', caption: 'Kontak resmi FSLDK Indonesia', href: '/tentang/kontak' },
  ];

  /** Isi dropdown navbar "Layanan" — data-driven (bukan `<a>` di-hardcode)
   *  supaya item baru tinggal ditambah ke array ini. */
  readonly lainnyaItems = [
    { icon: 'file-spreadsheet', title: 'Format Keuangan', caption: 'Template Excel Laporan Keuangan', href: financeformatPath.publicIndex },
    { icon: 'link', title: 'Shortlink', caption: 'Permintaan Pembuatan Shortlink', href: shortlinkPath.ajukan },
    { icon: 'qr-code', title: 'QR Code', caption: 'Permintaan Pembuatan QR Code', href: qrcodePath.ajukan },
    { icon: 'hand-heart', title: 'Kantong Amal', caption: 'Galang & Salurkan Donasi', href: '/kantong-amal' },
    { icon: 'calculator', title: 'Kalkulator Zakat', caption: 'Hitung 7 jenis zakat', href: zakatPath.calculator },
    { icon: 'shopping-bag', title: 'FSLDK Goods', caption: 'Katalog Produk & Merchandise Resmi', href: goodsPath.publicIndex },
  ];

  /** Isi dropdown navbar "Lainnya" — konten pelengkap di luar layanan inti. */
  readonly moreItems = [
    { icon: 'calendar', title: 'Jadwal', caption: 'Kalender kegiatan LDK', href: schedulePath.publicIndex },
  ];

  scrolled = signal(false);
  mobileOpen = signal(false);
  userMenuOpen = signal(false);
  tentangKamiMenuOpen = signal(false);
  lainnyaMenuOpen = signal(false);
  moreMenuOpen = signal(false);
  mobileTentangOpen = signal(false);
  mobileLayananOpen = signal(false);

  private onScroll = (): void => {
    const isScrolled = window.scrollY > 80;
    if (isScrolled !== this.scrolled()) {
      this.ngZone.run(() => this.scrolled.set(isScrolled));
    }
  };

  ngOnInit(): void {
    if (window.scrollY > 80) this.scrolled.set(true);
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.userMenuOpen.set(false);
    this.tentangKamiMenuOpen.set(false);
    this.lainnyaMenuOpen.set(false);
    this.moreMenuOpen.set(false);
  }

  toggleMobile(): void { this.mobileOpen.update((v) => !v); }
  closeMobile(): void { this.mobileOpen.set(false); }

  toggleMobileTentang(): void { this.mobileTentangOpen.update((v) => !v); }
  toggleMobileLayanan(): void { this.mobileLayananOpen.update((v) => !v); }

  openUserMenu(): void { this.userMenuOpen.set(true); }
  closeUserMenu(): void { this.userMenuOpen.set(false); }
  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  openTentangKamiMenu(): void { this.tentangKamiMenuOpen.set(true); }
  closeTentangKamiMenu(): void { this.tentangKamiMenuOpen.set(false); }
  toggleTentangKamiMenu(event: Event): void {
    event.stopPropagation();
    this.tentangKamiMenuOpen.update((v) => !v);
  }

  openLainnyaMenu(): void { this.lainnyaMenuOpen.set(true); }
  closeLainnyaMenu(): void { this.lainnyaMenuOpen.set(false); }
  toggleLainnyaMenu(event: Event): void {
    event.stopPropagation();
    this.lainnyaMenuOpen.update((v) => !v);
  }

  openMoreMenu(): void { this.moreMenuOpen.set(true); }
  closeMoreMenu(): void { this.moreMenuOpen.set(false); }
  toggleMoreMenu(event: Event): void {
    event.stopPropagation();
    this.moreMenuOpen.update((v) => !v);
  }

  isTentangKamiActive(): boolean {
    const path = this.router.url.split('?')[0];
    return this.tentangKamiItems.some((item) => path === item.href);
  }

  /** Trigger dropdown ikut tersorot solid saat halaman aktif adalah salah
   *  satu opsi di dropdown-nya, bukan cuma opsi-nya sendiri di dalam panel. */
  isLainnyaActive(): boolean {
    const path = this.router.url.split('?')[0];
    return this.lainnyaItems.some((item) => path === item.href);
  }

  isMoreActive(): boolean {
    const path = this.router.url.split('?')[0];
    return this.moreItems.some((item) => path === item.href);
  }

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  }

  shellBase(t: CmsTier): string { return CMS_SHELL_BASE[t]; }
  shellLabel(t: CmsTier): string { return CMS_SHELL_LABEL[t]; }
  shellIcon(t: CmsTier): string { return CMS_SHELL_ICON[t]; }
  tierColorOf(t: CmsTier): string { return TIER_COLOR[t]; }
  tierCaptionOf(t: CmsTier): string { return TIER_CAPTION[t]; }
  // Tint lembut per-tier untuk hover portal-item — sama persis dengan
  // tierTintOf() di cms-layout.component.ts (putih dicampur 15% warna tier).
  tierTintOf(t: CmsTier): string { return `color-mix(in srgb, #fff 85%, ${TIER_COLOR[t]} 15%)`; }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
