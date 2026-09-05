import { Component, HostListener, NgZone, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { SubmissionRepository } from '../modules/submission/repositories/submission.repository';
import { FORM_CODE_SENSUS_KADER } from '../modules/submission/entities/submission';
import { shortlinkPath } from '../modules/shortlink/shortlink.path';
import { financeformatPath } from '../modules/financeformat/financeformat.path';
import { zakatPath } from '../modules/zakat/zakat.path';
import { schedulePath } from '../modules/schedule/schedule.path';
import { goodsPath } from '../modules/goods/goods.path';
import { CmsTier, CMS_SHELL_BASE, CMS_SHELL_LABEL, CMS_SHELL_ICON } from './cms-tier';
import { IconComponent } from './icon.component';

const KADER_PENDING_STATUSES = ['SUBMITTED', 'LDK_REVIEW', 'REVISION_REQUESTED_LDK'];

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
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="nav-placeholder" [class.active]="scrolled()"></div>
    <header class="pub-header" [class.scrolled]="scrolled()">
      <div class="container flex items-center justify-between">
        <a routerLink="/" class="brand" (click)="closeMobile()">
          <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia" class="brand-logo-img">
          <span class="brand-text">FSLDK <b>Indonesia</b></span>
        </a>

        <div class="pub-nav-group">
          <nav class="pub-nav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Beranda</a>
            <div class="nav-dropdown-wrap" (mouseenter)="openTentangKamiMenu()" (mouseleave)="closeTentangKamiMenu()">
              <button type="button" class="nav-dropdown-trigger" [class.active]="isTentangKamiActive()" (click)="toggleTentangKamiMenu($event)">
                Tentang Kami <app-icon name="chevron-down" [size]="12" />
              </button>
              <div class="nav-dropdown-panel" [class.open]="tentangKamiMenuOpen()">
                @for (item of tentangKamiItems; track item.href) {
                  <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeTentangKamiMenu()">
                    <span class="icon-badge sm icon-badge-soft"><app-icon [name]="item.icon" [size]="15" /></span>
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
            <div class="nav-dropdown-panel" [class.open]="lainnyaMenuOpen()">
              @for (item of lainnyaItems; track item.href) {
                <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeLainnyaMenu()">
                  <span class="icon-badge sm icon-badge-soft"><app-icon [name]="item.icon" [size]="15" /></span>
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
                  <span class="icon-badge sm icon-badge-soft"><app-icon [name]="item.icon" [size]="15" /></span>
                  <span class="nav-dropdown-item-text">
                    <span class="nav-dropdown-item-title">{{ item.title }}</span>
                    <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
                  </span>
                </a>
              }
            </div>
          </div>
        </div>

        <div class="flex items-center gap-sm pub-actions">
          @if (auth.isLoggedIn()) {
            <div class="user-fun-wrap" (mouseenter)="openUserMenu()" (mouseleave)="closeUserMenu()">
              <button class="btn btn-outline btn-sm btn-user-fun account-chip" type="button" (click)="toggleUserMenu($event)">
                @if (auth.user()?.photoURL) {
                  <img class="chip-avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
                } @else {
                  <span class="chip-avatar">{{ initials() }}</span>
                }
                {{ auth.user()?.fullName }}
              </button>
              <div class="dropdown-fun" [class.open]="userMenuOpen()">
                @for (t of auth.accessibleCmsTiers(); track t) {
                  <a [routerLink]="shellBase(t) + '/dashboard'" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon [name]="shellIcon(t)" [size]="16" />{{ shellLabel(t) }}</a>
                }
                @if (auth.isKaderSelfService()) {
                  <a [routerLink]="kaderNavLink()" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon name="id-card" [size]="16" />{{ kaderNavLabel() }}</a>
                }
                <a routerLink="/akun/profil" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon name="user-circle" [size]="16" />Profil Saya</a>
                <button type="button" class="dropdown-fun-item" (click)="logout()"><app-icon name="log-out" [size]="16" />Keluar</button>
              </div>
            </div>
          } @else {
            <div class="user-fun-wrap" (mouseenter)="openUserMenu()" (mouseleave)="closeUserMenu()">
              <button class="btn btn-outline btn-sm btn-user-fun account-chip" type="button" (click)="toggleUserMenu($event)">
                <span class="chip-avatar guest"><app-icon name="guest" [size]="15" /></span> Pengunjung
              </button>
              <div class="dropdown-fun" [class.open]="userMenuOpen()">
                <a routerLink="/login" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon name="log-in" [size]="16" />Masuk</a>
                <a routerLink="/daftar" class="dropdown-fun-item" (click)="closeUserMenu()"><app-icon name="user-plus" [size]="16" />Daftar</a>
              </div>
            </div>
          }
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
          <img src="assets/logo-fsldk.svg" alt="Logo FSLDK Indonesia" class="brand-logo-img sm">
          <span class="brand-text">FSLDK <b>Indonesia</b></span>
        </a>
        <button class="mobile-close" (click)="closeMobile()" aria-label="Tutup menu">&times;</button>
      </div>
      <nav class="mobile-nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMobile()">Beranda</a>
      </nav>
      <div class="mobile-nav-extra">
        <span class="mobile-nav-label">Tentang Kami</span>
        @for (item of tentangKamiItems; track item.href) {
          <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeMobile()">
            <span class="icon-badge sm icon-badge-soft"><app-icon [name]="item.icon" [size]="15" /></span>
            <span class="nav-dropdown-item-text">
              <span class="nav-dropdown-item-title">{{ item.title }}</span>
              <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
            </span>
          </a>
        }
      </div>
      <nav class="mobile-nav">
        <a routerLink="/berita" routerLinkActive="active" (click)="closeMobile()">Berita</a>
        <a routerLink="/artikel" routerLinkActive="active" (click)="closeMobile()">Artikel</a>
        <a routerLink="/perpustakaan" routerLinkActive="active" (click)="closeMobile()">Perpustakaan</a>
        <a routerLink="/event" routerLinkActive="active" (click)="closeMobile()">Event</a>
      </nav>
      <div class="mobile-nav-extra">
        <span class="mobile-nav-label">Layanan</span>
        @for (item of lainnyaItems; track item.href) {
          <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeMobile()">
            <span class="icon-badge sm icon-badge-soft"><app-icon [name]="item.icon" [size]="15" /></span>
            <span class="nav-dropdown-item-text">
              <span class="nav-dropdown-item-title">{{ item.title }}</span>
              <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
            </span>
          </a>
        }
      </div>
      <div class="mobile-nav-extra">
        <span class="mobile-nav-label">Lainnya</span>
        @for (item of moreItems; track item.href) {
          <a [routerLink]="item.href" routerLinkActive="active" class="nav-dropdown-item" (click)="closeMobile()">
            <span class="icon-badge sm icon-badge-soft"><app-icon [name]="item.icon" [size]="15" /></span>
            <span class="nav-dropdown-item-text">
              <span class="nav-dropdown-item-title">{{ item.title }}</span>
              <span class="nav-dropdown-item-caption">{{ item.caption }}</span>
            </span>
          </a>
        }
      </div>
      <div class="mobile-actions">
        @if (auth.isLoggedIn()) {
          <div class="mobile-account">
            @if (auth.user()?.photoURL) {
              <img class="chip-avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
            } @else {
              <span class="chip-avatar">{{ initials() }}</span>
            }
            {{ auth.user()?.fullName }}
          </div>
          @for (t of auth.accessibleCmsTiers(); track t) {
            <a [routerLink]="shellBase(t) + '/dashboard'" class="btn btn-outline btn-block" (click)="closeMobile()"><app-icon [name]="shellIcon(t)" [size]="17" />{{ shellLabel(t) }}</a>
          }
          @if (auth.isKaderSelfService()) {
            <a [routerLink]="kaderNavLink()" class="btn btn-primary btn-block" (click)="closeMobile()"><app-icon name="id-card" [size]="17" />{{ kaderNavLabel() }}</a>
          }
          <a routerLink="/akun/profil" class="btn btn-outline btn-block" (click)="closeMobile()"><app-icon name="user-circle" [size]="17" />Profil Saya</a>
          <button type="button" class="btn btn-outline btn-block" (click)="logout(); closeMobile()"><app-icon name="log-out" [size]="17" />Keluar</button>
        } @else {
          <div class="mobile-account"><span class="chip-avatar guest"><app-icon name="guest" [size]="15" /></span> Pengunjung</div>
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

    .pub-header { position: relative; top: 0; left: 0; width: 100%; z-index: 60; background: rgba(255,255,255,.9); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--color-border); padding: 16px 0; }
    .pub-header.scrolled {
      position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
      width: min(1240px, calc(100% - 32px));
      border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); background: #fff; padding: 8px 20px;
      animation: navFadeIn .25s ease;
    }
    @keyframes navFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

    .brand { display: flex; align-items: center; gap: 12px; margin-right: 16px; flex-shrink: 0; }
    .brand:hover { text-decoration: none; }
    .brand-logo-img { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1px solid var(--color-border); flex-shrink: 0; transition: transform .2s ease; }
    .brand:hover .brand-logo-img { transform: rotate(-4deg) scale(1.04); }
    .brand-logo-img.sm { width: 36px; height: 36px; }
    .brand-text { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; display: flex; flex-direction: column; line-height: 1.1; white-space: nowrap; }
    .brand-text b { color: var(--color-primary); display: inline; }

    .pub-nav-group { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .pub-nav { display: flex; align-items: center; gap: 4px; }
    .mobile-nav a { position: relative; display: flex; align-items: center; gap: 7px; color: var(--color-text); font-weight: 600; transition: color var(--motion-fast) ease; }
    .pub-nav a svg, .mobile-nav a svg { opacity: .75; }
    .pub-nav a.active svg, .mobile-nav a.active svg { opacity: 1; }
    .mobile-nav a:hover { text-decoration: none; color: var(--color-primary-dark); }
    .pub-nav a {
      position: relative; display: flex; align-items: center; gap: 6px;
      padding: 8px 13px; border-radius: var(--radius-full); color: var(--color-text); font-weight: 600; font-size: .92rem;
      transition: color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
      white-space: nowrap;
    }
    .pub-nav a:hover { text-decoration: none; color: var(--color-primary-dark); background: var(--color-primary-soft); transform: translateY(-1px); }
    .pub-nav a.active { color: #fff; background: var(--color-primary); box-shadow: 0 4px 12px rgba(0,147,59,.28); }
    .pub-nav a.active:hover { color: #fff; background: var(--color-primary-dark); }
    .pub-nav a:focus-visible, .mobile-nav a:focus-visible, .btn-user-fun:focus-visible, .mobile-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; border-radius: var(--radius-xs); }

    .user-fun-wrap { position: relative; }
    .btn-user-fun { border: none; cursor: pointer; font-family: var(--font-body); }
    .account-chip { display: flex; align-items: center; gap: 8px; }
    .chip-avatar { width: 24px; height: 24px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; }
    .chip-avatar.guest { background: var(--color-bg-alt); color: var(--color-text-secondary); }
    img.chip-avatar { object-fit: cover; }
    .dropdown-fun {
      position: absolute; right: 0; top: 100%; margin-top: 8px; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 180px; padding: 8px;
      opacity: 0; visibility: hidden; transform-origin: top right; transform: scale(.85) translateY(-4px);
      transition: opacity var(--motion-base) var(--ease-out), transform var(--motion-base) var(--ease-out), visibility var(--motion-base);
      z-index: 70;
    }
    .dropdown-fun-item { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px 12px; border-radius: var(--radius-xs); border: none; background: none; color: var(--color-text); font-family: var(--font-body); font-weight: 600; font-size: .9rem; white-space: nowrap; cursor: pointer; transition: background var(--motion-fast) ease; }
    .dropdown-fun-item svg { opacity: .7; flex-shrink: 0; }
    .dropdown-fun-item:hover { background: var(--color-bg-warm); text-decoration: none; }
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
    .pub-actions { flex-shrink: 0; margin-left: 12px; }
    .nav-dropdown-wrap { position: relative; }
    .nav-dropdown-trigger {
      display: flex; align-items: center; gap: 5px; margin: 0; appearance: none;
      padding: 8px 13px; border-radius: var(--radius-full); border: none; background: none; cursor: pointer;
      color: var(--color-text); font-weight: 600; font-size: .92rem; font-family: var(--font-body); line-height: normal;
      transition: color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
      white-space: nowrap;
    }
    .nav-dropdown-trigger:hover { color: var(--color-primary-dark); background: var(--color-primary-soft); transform: translateY(-1px); }
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
      border-radius: 14px; box-shadow: var(--shadow-lg); min-width: 280px; padding: 14px;
      opacity: 0; visibility: hidden; transform-origin: top left; transform: scale(.85) translateY(-4px);
      transition: opacity var(--motion-base) var(--ease-out), transform var(--motion-base) var(--ease-out), visibility var(--motion-base);
      z-index: 70;
    }
    .nav-dropdown-panel.open { opacity: 1; visibility: visible; transform: scale(1) translateY(0); }
    @media (prefers-reduced-motion: reduce) { .nav-dropdown-panel { transition: opacity var(--motion-base) ease, visibility var(--motion-base); transform: none !important; } }

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
      transform: none;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .pub-nav a.nav-dropdown-item:hover,
    .nav-dropdown-item:hover {
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      text-decoration: none;
      transform: translateX(4px);
      box-shadow: none;
    }
    .pub-nav a.nav-dropdown-item.active,
    .nav-dropdown-item.active {
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      box-shadow: none;
      transform: none;
    }
    .pub-nav a.nav-dropdown-item.active:hover,
    .nav-dropdown-item.active:hover {
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      transform: translateX(4px);
      box-shadow: none;
    }
    .pub-nav a.nav-dropdown-item.active .nav-dropdown-item-title,
    .nav-dropdown-item.active .nav-dropdown-item-title {
      color: var(--color-primary-dark);
    }
    .pub-nav a.nav-dropdown-item.active .nav-dropdown-item-caption,
    .nav-dropdown-item.active .nav-dropdown-item-caption {
      color: var(--color-text-secondary);
    }
    .nav-dropdown-item-text { display: flex; flex-direction: column; gap: 1px; }
    .nav-dropdown-item-title { font-weight: 700; font-size: .9rem; }
    .nav-dropdown-item-caption { font-size: .78rem; color: var(--color-muted); }

    .mobile-nav-extra { display: flex; flex-direction: column; gap: 4px; padding: 0 12px 12px; }
    .mobile-nav-label { padding: 10px 14px 2px; font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
    .mobile-nav-extra .nav-dropdown-item { padding: 10px 14px; }

    .mobile-toggle { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px; width: 40px; height: 40px; background: var(--color-primary-soft); border: none; border-radius: var(--radius-xs); cursor: pointer; padding: 0; }
    .mobile-toggle span { display: block; width: 18px; height: 2px; background: var(--color-primary-dark); border-radius: 2px; transition: transform .25s ease, opacity .25s ease; }
    .mobile-toggle.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .mobile-toggle.active span:nth-child(2) { opacity: 0; }
    .mobile-toggle.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mobile-overlay { position: fixed; inset: 0; background: rgba(20,23,26,.5); backdrop-filter: blur(2px); z-index: 90; opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility .25s ease; }
    .mobile-overlay.active { opacity: 1; visibility: visible; }
    .mobile-drawer { position: fixed; top: 0; right: -100%; width: 82%; max-width: 320px; height: 100vh; height: 100dvh; background: #fff; z-index: 100; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(20,23,26,.15); transition: right .35s cubic-bezier(.4,0,.2,1); }
    .mobile-drawer.active { right: 0; }
    .mobile-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
    .mobile-close { width: 34px; height: 34px; border-radius: var(--radius-xs); background: var(--color-primary-soft); color: var(--color-primary-dark); border: none; font-size: 1.3rem; line-height: 1; cursor: pointer; }
    .mobile-nav { display: flex; flex-direction: column; padding: 12px; gap: 4px; }
    .mobile-nav a { padding: 13px 14px; border-radius: var(--radius-md); }
    .mobile-nav a.active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .mobile-actions { margin-top: auto; padding: 16px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 10px; }

    @media (max-width: 1080px) {
      .pub-nav-group, .pub-actions { display: none; }
      .mobile-toggle { display: flex; }
      .pub-header { padding: 12px 0; }
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
    { icon: 'messages', title: 'Hubungi Kami', caption: 'Kontak resmi FSLDK Indonesia', href: '/tentang/kontak' },
  ];

  /** Isi dropdown navbar "Layanan" — data-driven (bukan `<a>` di-hardcode)
   *  supaya item baru tinggal ditambah ke array ini. */
  readonly lainnyaItems = [
    { icon: 'link', title: 'Shortlink', caption: 'Permintaan Pembuatan Shortlink', href: shortlinkPath.ajukan },
    { icon: 'hand-heart', title: 'Kantong Amal', caption: 'Galang & Salurkan Donasi', href: '/kantong-amal' },
    { icon: 'calculator', title: 'Kalkulator Zakat', caption: 'Hitung 7 jenis zakat', href: zakatPath.calculator },
    { icon: 'shopping-bag', title: 'FSLDK Goods', caption: 'Katalog Produk & Merchandise Resmi', href: goodsPath.publicIndex },
  ];

  /** Isi dropdown navbar "Lainnya" — konten pelengkap di luar layanan inti. */
  readonly moreItems = [
    { icon: 'file-spreadsheet', title: 'Format Keuangan', caption: 'Template Excel Laporan Keuangan', href: financeformatPath.publicIndex },
    { icon: 'calendar', title: 'Jadwal', caption: 'Kalender kegiatan LDK', href: schedulePath.publicIndex },
  ];

  scrolled = signal(false);
  mobileOpen = signal(false);
  userMenuOpen = signal(false);
  tentangKamiMenuOpen = signal(false);
  lainnyaMenuOpen = signal(false);
  moreMenuOpen = signal(false);

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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
