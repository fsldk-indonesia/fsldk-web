import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { PermissionRepository } from '../modules/permission/repositories/permission.repository';
import { OrganizationRepository } from '../modules/organization/repositories/organization.repository';
import { OrgContextService } from '../core/services/org-context.service';
import { MenuItem } from '../modules/permission/entities/menu-item';
import { MeOrganization } from '../modules/organization/entities/organization';
import { IconComponent } from '../shared/icon.component';
import { PrayerTimeComponent } from '../shared/prayer-time.component';
import { CmsTier, CMS_SHELL_BASE, CMS_SHELL_LABEL, CMS_SHELL_ICON } from '../shared/cms-tier';

type Tier = CmsTier;

// Harus sama persis dengan breakpoint @media (max-width: 900px) di styles
// komponen ini — dipakai default sidebarOpen() & close()-on-navigate.
const MOBILE_BREAKPOINT = 900;

/** Konfigurasi grup sidebar collapsible — dikelompokkan berdasarkan prefix
 *  `menuRoute` (bukan field baru dari backend; `GET /me/menus` tetap
 *  mengembalikan daftar flat, `menuLabel`/`menuIcon`/`menuRoute`/`sortOrder`
 *  saja). Ditulis generik supaya modul lain bisa ikut dikelompokkan tanpa
 *  perlu menulis ulang mekanismenya — dipakai "Kantong Amal" dan
 *  "Shortlink" (Shortlink + Permintaan Shortlink, lihat migrasi
 *  0033_shortlink_sidebar_group.up.sql di fsldk-api). */
interface SidebarGroupConfig {
  label: string;
  icon: string;
  routePrefix: string;
}
const SIDEBAR_GROUPS: SidebarGroupConfig[] = [
  { label: 'Kantong Amal', icon: 'hand-heart', routePrefix: '/cms/kantong-amal' },
  { label: 'Shortlink', icon: 'link', routePrefix: '/cms/shortlink' },
  { label: 'FSLDK Goods', icon: 'shopping-bag', routePrefix: '/cms/goods' },
];

type SidebarEntry =
  | { kind: 'item'; item: MenuItem }
  | { kind: 'group'; config: SidebarGroupConfig; children: MenuItem[] };

// Warna solid per-tier untuk item AKTIF di dropdown akun — SAMA dengan
// --color-primary yang dipakai tema .cms.tier-* (lihat styles di bawah),
// tapi harus di-hardcode terpisah di sini karena dropdown ini menampilkan
// SEMUA tier yang bisa diakses akun sekaligus (bisa lebih dari satu), bukan
// cuma tier yang lagi aktif — CSS custom property tema hanya merefleksikan
// tier yang aktif saat ini, tidak bisa dipakai untuk mewarnai tier LAIN yang
// sedang tidak dibuka. (Outline resting-state pernah dicoba di sini juga,
// lalu diminta dihilangkan lagi — kini polos seperti item lain sampai aktif.)
const TIER_COLOR: Record<CmsTier, string> = {
  FSLDK: '#00933b', PUSKOMNAS: '#55408f', PUSKOMDA: '#186541', LDK: '#063c84',
};
const TIER_CAPTION: Record<CmsTier, string> = {
  FSLDK: 'Kelola seluruh konten & pengguna sistem',
  PUSKOMNAS: 'Verifikasi & penetapan level nasional',
  PUSKOMDA: 'Verifikasi & pendataan wilayah',
  LDK: 'Kelola pendataan & kader LDK Anda',
};

/** Siluet kanvas CMS (pola sama persis dengan dashboard admin ldksyahid-app:
 *  pennant, lingkaran target, dokumen+baris, panah/play, check-circle, chat
 *  bubble — tile 120px, opacity .18), diwarnai sesuai --color-primary tier
 *  aktif. Dibangun sebagai fungsi (bukan 4 blok CSS statis) karena data-URI
 *  SVG tidak bisa baca CSS custom property, dan menduplikasi string SVG ini
 *  4x sebagai styles component sempat membuat bundle lewat batas anyComponentStyle. */
function canvasSilhouetteUrl(hex: string): string {
  const c = hex.replace('#', '%23');
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpath d='M30 12l-5 8h10l-5-8zm0 4l2.5 4h-5l2.5-4z' fill='${c}' fill-opacity='0.18'/%3E%3Ccircle cx='90' cy='20' r='6' fill='none' stroke='${c}' stroke-opacity='0.18' stroke-width='1.2'/%3E%3Ccircle cx='90' cy='20' r='2.2' fill='${c}' fill-opacity='0.18'/%3E%3Crect x='10' y='75' width='14' height='16' rx='2' fill='none' stroke='${c}' stroke-opacity='0.18' stroke-width='1.2'/%3E%3Cline x1='13' y1='80' x2='21' y2='80' stroke='${c}' stroke-opacity='0.18' stroke-width='1'/%3E%3Cline x1='13' y1='83.5' x2='21' y2='83.5' stroke='${c}' stroke-opacity='0.18' stroke-width='1'/%3E%3Cline x1='13' y1='87' x2='19' y2='87' stroke='${c}' stroke-opacity='0.18' stroke-width='1'/%3E%3Cpath d='M82 72l8 5-8 5z' fill='none' stroke='${c}' stroke-opacity='0.18' stroke-width='1.2'/%3E%3Ccircle cx='58' cy='52' r='8' fill='none' stroke='${c}' stroke-opacity='0.18' stroke-width='1.2'/%3E%3Cpath d='M55 52l2.5 2.5 5-5' fill='none' stroke='${c}' stroke-opacity='0.18' stroke-width='1.2'/%3E%3Cpath d='M85 100a6 6 0 01-6 6h-2v3l-5-3h-3a6 6 0 01-6-6v-3a6 6 0 016-6h10a6 6 0 016 6z' fill='none' stroke='${c}' stroke-opacity='0.18' stroke-width='1.2'/%3E%3C/svg%3E")`;
}

/**
 * Shell CMS — dipakai untuk 4 route tree terpisah (cms/cms-ldk/cms-puskomda/
 * cms-puskomnas, lihat app.routes.ts). `tier` datang dari route `data` dan
 * menentukan: prefix dasar link Dashboard, filter menu sidebar (hanya item
 * yang menuRoute-nya diawali prefix shell ini — lk_permission sudah di-set
 * per shell lewat migration 0010), tema warna (mix 70/20/10 untuk LDK/
 * Puskomda/Puskomnas, default untuk FSLDK), dan kemunculan org-switcher
 * lokal (hanya shell LDK/Puskomda, TIDAK di FSLDK/Puskomnas — poin 3
 * miss-development-clarification.md).
 */
@Component({
  selector: 'app-cms-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, PrayerTimeComponent],
  template: `
    <div class="cms" [class.tier-ldk]="tier() === 'LDK'" [class.tier-puskomda]="tier() === 'PUSKOMDA'" [class.tier-puskomnas]="tier() === 'PUSKOMNAS'" [class.sidebar-collapsed]="!sidebarOpen()" [style.background-image]="canvasBackgroundImage()">
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="side-brand">
          <span class="brand-icon"><img src="assets/logo-fsldk.svg" alt="Logo FSLDK"></span>
          <span>{{ brandLabel() }}</span>
        </div>
        <nav class="side-nav">
          <a [routerLink]="shellBase() + '/dashboard'" queryParamsHandling="preserve" routerLinkActive="active" (click)="close()" class="stagger-in" style="--stagger-i:0">
            <span class="icon-badge sm icon-badge-soft"><app-icon name="dashboard" [size]="17" /></span> Dashboard
          </a>
          @for (entry of sidebarEntries(); track entry.kind === 'group' ? entry.config.label : entry.item.menuRoute; let i = $index) {
            @if (entry.kind === 'item') {
              <a [routerLink]="entry.item.menuRoute" queryParamsHandling="preserve" routerLinkActive="active" (click)="close()" class="stagger-in" [style.--stagger-i]="i + 1">
                <span class="icon-badge sm icon-badge-soft"><app-icon [name]="entry.item.menuIcon" [size]="17" /></span> {{ entry.item.menuLabel }}
              </a>
            } @else {
              <button type="button" class="side-nav-group-trigger stagger-in" [style.--stagger-i]="i + 1" (click)="toggleGroup(entry.config.label)">
                <span class="icon-badge sm icon-badge-soft"><app-icon [name]="entry.config.icon" [size]="17" /></span>
                <span class="side-nav-group-label">{{ entry.config.label }}</span>
                <app-icon name="chevron-down" [size]="12" class="side-nav-group-chevron" [class.open]="isGroupExpanded(entry.config.label)" />
              </button>
              <div class="side-nav-group-children" [class.expanded]="isGroupExpanded(entry.config.label)">
                <div class="side-nav-group-children-inner">
                  @for (child of entry.children; track child.menuRoute) {
                    <a [routerLink]="child.menuRoute" queryParamsHandling="preserve" routerLinkActive="active" (click)="close()">
                      <span class="icon-badge sm icon-badge-soft"><app-icon [name]="child.menuIcon" [size]="15" /></span> {{ child.menuLabel }}
                    </a>
                  }
                </div>
              </div>
            }
          }
        </nav>
      </aside>

      <div class="cms-main">
        <header class="topbar">
          <button class="hamburger" (click)="toggle()" aria-label="Buka/tutup sidebar">
            <span></span><span></span><span></span>
          </button>
          @if (showOrgSwitcher()) {
            <div class="org-switcher">
              <button class="org-switcher-btn" type="button" (click)="toggleOrgDropdown($event)">
                <app-icon [name]="switcherIcon()" [size]="14" />
                <span>{{ currentOrgName() ?? 'Pilih Organisasi' }}</span>
                <app-icon name="chevron-down" [size]="12" />
              </button>
              @if (orgDropdownOpen()) {
                <div class="dropdown-panel org-dropdown-panel">
                  <input class="form-control" placeholder="Cari organisasi..." [value]="orgSearch()" (input)="onOrgSearch($event)" (click)="$event.stopPropagation()">
                  @for (o of orgOptions(); track o.organizationID) {
                    <button type="button" [class.active]="o.organizationID === currentOrgID()" (click)="selectOrganization(o.organizationID)">
                      {{ o.organizationName }}
                    </button>
                  } @empty {
                    <p class="text-muted org-empty">Tidak ada organisasi lain.</p>
                  }
                </div>
              }
            </div>
          }
          <div class="spacer"></div>
          <app-prayer-time />
          <a routerLink="/" class="nav-website-link">
            <app-icon name="globe" [size]="15" />
            Website
          </a>
          <div class="user-dropdown" (mouseenter)="openDropdown()" (mouseleave)="closeDropdown()">
            <button class="user-chip" type="button" (click)="toggleDropdown($event)">
              @if (auth.user()?.photoURL) {
                <img class="avatar" [src]="auth.user()?.photoURL" alt="" referrerpolicy="no-referrer">
              } @else {
                <span class="avatar">{{ initials() }}</span>
              }
              <div class="user-meta">
                <strong>{{ auth.user()?.fullName }}</strong>
                <small>{{ auth.user()?.role }}</small>
              </div>
              <app-icon name="chevron-down" [size]="12" class="caret" [class.open]="dropdownOpen()" />
            </button>
            @if (dropdownOpen()) {
              <div class="dropdown-panel">
                @for (t of auth.accessibleCmsTiers(); track t) {
                  <a [routerLink]="shellBaseOf(t) + '/dashboard'" (click)="closeAllDropdowns()"
                     class="portal-item" [class.active]="tier() === t"
                     [style.background]="tier() === t ? tierTintOf(t) : null">
                    <span class="icon-badge sm" [class.icon-badge-soft]="tier() !== t"
                          [style.background]="tier() === t ? tierColorOf(t) : null"
                          [style.color]="tier() === t ? '#fff' : null">
                      <app-icon [name]="shellIconOf(t)" [size]="15" />
                    </span>
                    <span class="dropdown-item-text">
                      <span class="dropdown-item-title" [style.color]="tier() === t ? tierColorOf(t) : null">{{ shellLabelOf(t) }}</span>
                      <span class="dropdown-item-caption">{{ tierCaptionOf(t) }}</span>
                    </span>
                  </a>
                }
                <a routerLink="/akun/profil" (click)="closeAllDropdowns()">
                  <span class="icon-badge sm icon-badge-soft"><app-icon name="user-circle" [size]="15" /></span>
                  <span class="dropdown-item-text">
                    <span class="dropdown-item-title">Profil Saya</span>
                    <span class="dropdown-item-caption">Lihat &amp; ubah profil Anda</span>
                  </span>
                </a>
                <button type="button" class="dropdown-divider-top" (click)="logout()">
                  <span class="icon-badge sm icon-badge-danger"><app-icon name="log-out" [size]="15" /></span>
                  <span class="dropdown-item-text">
                    <span class="dropdown-item-title">Keluar</span>
                    <span class="dropdown-item-caption">Keluar dari akun Anda</span>
                  </span>
                </button>
              </div>
            }
          </div>
        </header>
        <main class="cms-content"><div class="page-shell"><router-outlet /></div></main>
        <footer class="cms-footer">
          <div class="cms-footer-inner">
            <span>&copy; {{ year }} FSLDK Indonesia. Seluruh hak cipta dilindungi.</span>
            <span class="text-muted">Dikembangkan oleh Tim IT FSLDK Indonesia</span>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    /* Latar kanvas CMS — pola sama persis dengan dashboard admin
       ldksyahid-app (pennant/bendera, lingkaran target, dokumen+baris,
       panah/play, check-circle, chat bubble), ukuran ubin 120px & opacity
       .18 disamakan; hanya warna diganti ke primary hijau FSLDK. */
    .cms {
      min-height: 100dvh; background-color: var(--color-bg-warm);
      background-size: 120px 120px;
    }
    /* Sidebar sekarang bisa ditutup/dibuka di SEMUA lebar layar (dulu hanya
       mobile) — .sidebar:not(.open) selalu geser keluar lewat transform,
       .cms-main mengikuti lewat margin-left di .cms.sidebar-collapsed
       (lihat rule-nya di bawah). */
    .sidebar {
      width: 260px; background: #fff; border-right: 1px solid var(--color-border); color: var(--color-text);
      display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100dvh; z-index: 40;
      overflow: hidden; box-shadow: 2px 0 28px rgba(15,23,20,.05);
      transition: transform var(--motion-slow) var(--ease-out), box-shadow var(--motion-slow) ease;
    }
    .sidebar:not(.open) { transform: translateX(-100%); box-shadow: none; }
    .side-brand {
      position: relative; z-index: 1; flex-shrink: 0; display: flex; align-items: center; gap: 10px;
      font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; padding: 22px 16px 18px;
      color: var(--color-text); background: #fff; border-bottom: 1px solid var(--color-border);
    }
    .brand-icon { width: 36px; height: 36px; border-radius: var(--radius-xs); overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-sm); }
    .brand-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
    /* .side-nav adalah SATU-SATUNYA yang discroll — .side-brand di atas tetap
       diam (poin 6): min-height:0 wajib supaya flex child ini benar-benar
       bisa menciut & memicu overflow, bukan mendorong tinggi .sidebar. */
    .side-nav {
      position: relative; z-index: 1; display: flex; flex-direction: column; gap: 6px; flex: 1; min-height: 0;
      overflow-y: auto; padding: 16px; scrollbar-width: thin; scrollbar-color: var(--color-border-strong) transparent;
    }
    .side-nav::-webkit-scrollbar { width: 6px; }
    .side-nav::-webkit-scrollbar-track { background: transparent; }
    .side-nav::-webkit-scrollbar-thumb { background-color: var(--color-border-strong); border-radius: var(--radius-full); }
    .side-nav a { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: var(--radius-md); color: var(--color-text-secondary); font-weight: 600; font-size: .95rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease; }
    .side-nav a:hover { background: var(--color-bg-alt); color: var(--color-text); text-decoration: none; transform: translateX(3px); }
    .side-nav a.active { background: var(--color-primary); color: #fff; box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary) 35%, transparent); }
    .side-nav a.active:hover { background: var(--color-primary-dark); color: #fff; transform: translateX(3px); }
    .side-nav a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    .side-nav a.active .icon-badge { background: rgba(255,255,255,.22); color: #fff; box-shadow: none; }
    .side-nav-group-trigger { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 10px; border: none; background: none; border-radius: var(--radius-md); color: var(--color-text-secondary); font-weight: 600; font-size: .95rem; font-family: var(--font-body); cursor: pointer; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .side-nav-group-trigger:hover { background: var(--color-bg-alt); color: var(--color-text); }
    .side-nav-group-label { flex: 1; text-align: left; }
    .side-nav-group-chevron { color: var(--color-muted); transition: transform var(--motion-fast) ease; flex-shrink: 0; }
    .side-nav-group-chevron.open { transform: rotate(180deg); }
    /* Ekspand/ciut submenu "grid-template-rows: 0fr -> 1fr" — animasi tinggi
       otomatis tanpa perlu tahu/hitung tinggi kontennya lebih dulu (jumlah
       anak per grup beda-beda), plus overflow:hidden di -inner supaya
       kontennya benar-benar terciutkan sampai 0, bukan cuma ketutup. */
    .side-nav-group-children { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--motion-base) var(--ease-out); }
    .side-nav-group-children.expanded { grid-template-rows: 1fr; }
    .side-nav-group-children-inner { overflow: hidden; min-height: 0; display: flex; flex-direction: column; gap: 4px; padding-left: 18px; margin: 2px 0 4px; border-left: 2px solid var(--color-border); }
    .side-nav-group-children a { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: var(--radius-md); color: var(--color-text-secondary); font-weight: 600; font-size: .88rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out); }
    .side-nav-group-children a:hover { background: var(--color-bg-alt); color: var(--color-text); text-decoration: none; transform: translateX(3px); }
    .side-nav-group-children a.active { background: var(--color-primary); color: #fff; }
    .side-nav-group-children a.active .icon-badge { background: rgba(255,255,255,.22); color: #fff; box-shadow: none; }
    @media (prefers-reduced-motion: reduce) {
      .sidebar, .cms-main, .topbar, .side-nav-group-children, .hamburger span { transition: none !important; }
    }
    .cms-main {
      margin-left: 260px; display: flex; flex-direction: column; min-width: 0; min-height: 100dvh;
      /* Topbar sekarang position:fixed & "mengambang" (bukan bar penuh
         nempel ke pojok — lihat catatan di .topbar), jadi keluar dari flex
         flow ini; padding-top di sini menggantikan ruangnya supaya
         .cms-content tidak start ketiban di bawah topbar. Nilainya = jarak
         atas topbar (8px) + tinggi topbar (~56px) + jarak sebelum konten
         (12px). */
      padding-top: 76px;
      transition: margin-left var(--motion-slow) var(--ease-out);
    }
    .cms.sidebar-collapsed .cms-main { margin-left: 0; }
    /* Topbar nempel penuh di tepi ATAS (top:0, tanpa jarak) tapi mengambang
       LEBAR di kanan-kiri: left/right diset ke tepi track yang tersedia
       (edge sidebar s/d edge layar), lalu max-width + margin:0 auto
       men-center bar-nya di tengah track itu — memberi jarak kosong yang
       renggang di kedua sisi, bukan sekadar gap kecil tetap.
       position:fixed (bukan sticky) — sticky sebelumnya kadang gagal nempel
       tergantung konteks scroll/stacking ancestor-nya; fixed selalu pasti
       nempel di viewport terlepas dari itu. left mengikuti lebar sidebar
       (geser saat sidebar collapsed/mobile) via transition yang sama
       dengan .cms-main supaya topbar & konten tetap sejajar saat toggle. */
    .topbar {
      display: flex; align-items: center; gap: 12px; padding: 10px 18px; background: #fff;
      border: 1px solid var(--color-border); border-radius: 0 0 var(--radius-md) var(--radius-md); box-shadow: var(--shadow-sm);
      position: fixed; top: 0; left: 260px; right: 0; z-index: 20;
      max-width: 1100px; margin: 0 auto;
      transition: left var(--motion-slow) var(--ease-out);
    }
    .cms.sidebar-collapsed .topbar { left: 0; }
    .spacer { flex: 1; }
    /* PrayerTimeComponent (dipakai bersama navbar publik) defaultnya pil
       penuh (--radius-full) — di topbar CMS ini SENGAJA dikotakkan (radius
       kecil, bukan pil) supaya konsisten dengan tombol lain di topbar ini.
       ::ng-deep dipilih karena stylenya ada di komponen anak yang encapsulated
       (pola sama dipakai tema per-tier .cms-content ::ng-deep .card di bawah). */
    .topbar ::ng-deep .prayer-btn { border-radius: var(--radius-xs); }
    .org-switcher { position: relative; }
    .org-switcher-btn { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: var(--radius-xs); border: 1px solid var(--color-border); background: var(--color-bg-warm); color: var(--color-text); font-weight: 600; font-size: .88rem; cursor: pointer; transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .org-switcher-btn:hover { background: var(--color-primary-soft); border-color: var(--color-primary); }
    .org-switcher-btn span { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .org-dropdown-panel { left: 0; right: auto; min-width: 280px; max-height: 360px; overflow-y: auto; gap: 4px; }
    .org-dropdown-panel input { margin-bottom: 6px; }
    .org-dropdown-panel button.active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .org-empty { padding: 8px 12px; font-size: .85rem; }
    /* Hamburger sekarang selalu tampil di topbar (dulu cuma mobile) — satu
       tombol men-toggle sidebarOpen di semua lebar layar. Ikonnya TETAP 3
       garis apa pun status sidebar-nya (tidak berubah jadi "X"). Diberi
       badge hijau (bukan transparan) supaya ikonnya tidak "menyatu" dengan
       latar topbar putih. */
    .hamburger {
      display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px;
      width: 38px; height: 38px; border-radius: var(--radius-xs); background: var(--color-primary-soft); border: none;
      cursor: pointer; flex-shrink: 0; transition: background var(--motion-fast) ease;
    }
    .hamburger:hover { background: var(--color-primary); }
    .hamburger span { display: block; width: 18px; height: 2px; border-radius: 2px; background: var(--color-primary-dark); transition: background var(--motion-fast) ease; }
    .hamburger:hover span { background: #fff; }
    /* Website & akun: tanpa latar sama sekali di kondisi diam (dicoba pakai
       latar abu, lalu hijau — keduanya ditolak), hover cukup highlight
       netral tipis seperti item dropdown lain di app ini. */
    .nav-website-link { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-xs); background: none; border: none; color: var(--color-text-secondary); font-weight: 600; font-size: .9rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .nav-website-link:hover { background: var(--color-bg-warm); color: var(--color-primary-dark); text-decoration: none; }
    .user-dropdown { position: relative; }
    .user-chip { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; padding: 6px 8px; border-radius: var(--radius-xs); font-family: var(--font-body); transition: background var(--motion-fast) ease; }
    .user-chip:hover { background: var(--color-bg-warm); }
    .avatar { width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; }
    img.avatar { object-fit: cover; }
    .user-meta { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
    .user-meta strong { transition: color var(--motion-fast) ease; }
    .user-meta small { color: var(--color-muted); font-size: .78rem; transition: color var(--motion-fast) ease; }
    .caret { color: var(--color-muted); transition: transform var(--motion-fast) ease, color var(--motion-fast) ease; flex-shrink: 0; }
    .caret.open { transform: rotate(180deg); }
    .dropdown-panel {
      position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 280px; padding: 8px;
      display: flex; flex-direction: column; gap: 3px; z-index: 30;
      transform-origin: top right; animation: dropdown-panel-in var(--motion-base) var(--ease-out) both;
    }
    /* Invisible hover bridge over the 8px gap above the panel — without it,
       that gap is dead space outside both .user-dropdown's own box (which
       ends at the trigger button, since the panel is absolutely positioned
       and out of flow) and the panel's box, so moving the pointer straight
       down from the trigger fires mouseleave on .user-dropdown before ever
       reaching the panel, closing it before a click can land. */
    .dropdown-panel::before { content: ''; position: absolute; top: -8px; left: 0; right: 0; height: 8px; }
    @keyframes dropdown-panel-in { from { opacity: 0; transform: scale(.85) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .dropdown-panel { animation: none; } }
    .dropdown-panel a, .dropdown-panel button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 8px 12px; border-radius: var(--radius-xs); border: 1.5px solid transparent; background: none; cursor: pointer; font-family: var(--font-body); font-size: .9rem; font-weight: 600; color: var(--color-text); transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .dropdown-panel a:hover, .dropdown-panel button:hover { background: var(--color-bg-warm); text-decoration: none; }
    /* Ini yang sebenarnya bikin "outline hitam" yang dilaporkan — bukan
       border tier-color-nya, tapi outline FOKUS bawaan browser (muncul di
       link/tombol manapun yang baru diklik/di-tab), yang sebelumnya tidak
       pernah di-reset di sini. Ditiadakan untuk klik mouse biasa, diganti
       cincin hijau bermerek HANYA untuk navigasi keyboard (:focus-visible)
       — pola yang sama persis dipakai .side-nav a di atas. */
    .dropdown-panel a:focus, .dropdown-panel button:focus { outline: none; }
    .dropdown-panel a:focus-visible, .dropdown-panel button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    .dropdown-item-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .dropdown-item-title { font-weight: 700; color: var(--color-text); font-size: .9rem; }
    .dropdown-item-caption { font-size: .76rem; color: var(--color-muted); font-weight: 500; line-height: 1.3; }
    /* Item aktif: latar putih dicampur warna tier (color-mix, lihat
       tierTintOf) — bukan outline (dihilangkan lagi atas permintaan) dan
       bukan solid+teks putih (diganti tint lembut+teks berwarna, senada
       gaya "soft" icon-badge/chip lain di app ini). Semua warnanya di-set
       LANGSUNG lewat [style.background]/[style.color] di template, bukan
       custom property var() — custom property sempat dicoba lebih dulu
       untuk versi outline, background-nya gagal ke-resolve dengan CSS var(). */
    .portal-item:not(.active):hover { background: var(--color-bg-warm); }
    /* Garis pemisah sebelum "Keluar" — dipisah dari aksi navigasi portal/
       profil di atasnya karena ini aksi destruktif (keluar akun). */
    .dropdown-panel .dropdown-divider-top { border-top: 1px solid var(--color-border); margin-top: 5px; padding-top: 14px; }
    /* Kotak "Cari organisasi..." tetap teks biasa (tanpa icon-badge), jadi
       pola opacity dim lama tidak lagi relevan — item lain sekarang pakai
       icon-badge berwarna (lihat markup), bukan ikon polos. */
    .cms-content { padding: 32px 28px; flex: 1; }
    /* Pembungkus card seragam untuk SEMUA halaman index & form CMS (4 portal),
       dipasang sekali di sini (bukan per-halaman) supaya konsisten & mudah
       diubah dari satu tempat — mengikuti lebar+center yang sama dengan
       topbar/footer. Banyak halaman index/form sudah punya .page-head lalu
       satu .card/.card-pad pembungkus tabel/form-nya sendiri; kalau
       dibiarkan, itu akan tampak sebagai card-di-dalam-card (border+shadow
       dobel) di dalam page-shell ini — makanya pola itu diratakan lewat rule
       kedua di bawah (HANYA .page-head + .card, bukan semua .card, supaya
       card lain yang memang sengaja terpisah — mis. grup stat berdampingan —
       tidak ikut kehilangan border-nya). */
    .page-shell {
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); padding: 28px; max-width: 1100px; margin: 0 auto;
    }
    .page-shell ::ng-deep .page-head + .card {
      background: transparent; border: none; box-shadow: none;
    }
    @media (max-width: 640px) { .page-shell { padding: 18px; } }
    /* Footer nempel penuh di tepi BAWAH (padding-bottom 0, radius bawah 0 —
       kebalikan dari topbar yang nempel di ATAS dengan radius atas 0), tapi
       radius atas & lebar/center-nya (max-width + margin:auto) SAMA dengan
       topbar. Statis di akhir flex column .cms-main seperti sebelumnya —
       BUKAN position:sticky/fixed, cukup normal flow. */
    .cms-footer { padding: 0; }
    .cms-footer-inner {
      background: var(--color-bg-alt); border-radius: var(--radius-md) var(--radius-md) 0 0;
      max-width: 1060px; margin: 0 auto; padding: 18px 24px;
      display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
      font-size: .85rem; color: var(--color-text-secondary);
    }
    @media (max-width: 900px) {
      /* Di bawah 900px sidebar jadi drawer mengambang (overlay), bukan
         mendorong konten — z-index dinaikkan & .cms-main/.topbar SELALU
         left/margin-left 0 di sini, apa pun status sidebarOpen/
         .sidebar-collapsed (override base rule di atas yang berlaku untuk
         desktop), karena sidebar tidak lagi mendorong apa pun di mobile. */
      .sidebar.open { box-shadow: var(--shadow-lg); z-index: 60; }
      .cms-main, .cms.sidebar-collapsed .cms-main { margin-left: 0; }
      .topbar, .cms.sidebar-collapsed .topbar { left: 8px; right: 8px; top: 0; padding: 8px 14px; gap: 10px; }
    }

    /* Tema per tier (poin 2 miss-development-clarification.md): CMS Utama
       (tanpa kelas tier-*) tetap tema default. LDK/Puskomda/Puskomnas
       memakai mix 70% warna tier + 20% putih + 10% hijau brand (#00933b),
       diterapkan ke SELURUH permukaan termasuk card/panel konten (bukan
       cuma background halaman & sidebar) sesuai keputusan yang dikonfirmasi
       — kontras teks tetap dijaga karena tint-nya sangat ringan (--color-text
       tidak diubah, tetap gelap solid). Dihitung sekali lewat color-mix()
       sebagai custom property, dipakai ulang oleh .card/.cms/.sidebar/.topbar.
     */
    .cms.tier-ldk {
      --color-primary: #063c84; --color-primary-dark: #042c61; --color-primary-darker: #021a3a;
      --color-primary-bright: #1f5db3; --color-primary-soft: #e2e9f5; --color-primary-tint: #f4f7fc;
      --tier-mix: color-mix(in srgb, #063c84 70%, color-mix(in srgb, #ffffff 66.7%, #00933b 33.3%) 30%);
    }
    .cms.tier-puskomda {
      --color-primary: #186541; --color-primary-dark: #0f4a30; --color-primary-darker: #092e1d;
      --color-primary-bright: #2f9161; --color-primary-soft: #e0f0e6; --color-primary-tint: #f4faf6;
      --tier-mix: color-mix(in srgb, #186541 70%, color-mix(in srgb, #ffffff 66.7%, #00933b 33.3%) 30%);
    }
    .cms.tier-puskomnas {
      --color-primary: #55408f; --color-primary-dark: #3e2f6b; --color-primary-darker: #291f47;
      --color-primary-bright: #7a63b8; --color-primary-soft: #ece8f7; --color-primary-tint: #f8f6fc;
      --tier-mix: color-mix(in srgb, #55408f 70%, color-mix(in srgb, #ffffff 66.7%, #00933b 33.3%) 30%);
    }
    .cms.tier-ldk, .cms.tier-puskomda, .cms.tier-puskomnas {
      background-color: color-mix(in srgb, var(--tier-mix) 22%, var(--color-bg-warm) 78%);
    }
    .cms.tier-ldk .sidebar, .cms.tier-puskomda .sidebar, .cms.tier-puskomnas .sidebar,
    .cms.tier-ldk .topbar, .cms.tier-puskomda .topbar, .cms.tier-puskomnas .topbar,
    .cms.tier-ldk .cms-content ::ng-deep .card, .cms.tier-puskomda .cms-content ::ng-deep .card, .cms.tier-puskomnas .cms-content ::ng-deep .card {
      background-color: color-mix(in srgb, var(--tier-mix) 14%, #fff 86%);
    }
  `],
})
export class CmsLayoutComponent implements OnInit {
  auth = inject(AuthRepository);
  private orgRepo = inject(OrganizationRepository);
  private permissionRepo = inject(PermissionRepository);
  private orgContext = inject(OrgContextService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tier = signal<Tier>('FSLDK');
  shellBase = computed(() => CMS_SHELL_BASE[this.tier()]);
  brandLabel = computed(() => CMS_SHELL_LABEL[this.tier()]);
  showOrgSwitcher = computed(() => this.tier() === 'LDK' || this.tier() === 'PUSKOMDA');
  switcherIcon = computed(() => CMS_SHELL_ICON[this.tier()]);
  canvasBackgroundImage = computed(() => canvasSilhouetteUrl(TIER_COLOR[this.tier()]));

  shellBaseOf(t: CmsTier): string { return CMS_SHELL_BASE[t]; }
  shellLabelOf(t: CmsTier): string { return CMS_SHELL_LABEL[t]; }
  shellIconOf(t: CmsTier): string { return CMS_SHELL_ICON[t]; }
  tierColorOf(t: CmsTier): string { return TIER_COLOR[t]; }
  // Latar item aktif: putih dicampur warna tier (bukan solid penuh) —
  // permintaan revisi terbaru, ganti dari fill solid+teks putih ke tint
  // lembut+teks berwarna, senada gaya "soft" (icon-badge-soft, chip-green,
  // dst.) yang sudah dipakai di seluruh app ini.
  tierTintOf(t: CmsTier): string { return `color-mix(in srgb, #fff 85%, ${TIER_COLOR[t]} 15%)`; }
  tierCaptionOf(t: CmsTier): string { return TIER_CAPTION[t]; }

  allMenus = signal<MenuItem[]>([]);
  menus = computed(() => this.allMenus().filter((m) => m.menuRoute.startsWith(this.shellBase() + '/')));

  // Grup sidebar collapsible (mis. "Kantong Amal") — partisi menus() jadi
  // urutan item flat & grup, menjaga posisi grup persis di mana anak
  // pertamanya seharusnya muncul (mengikuti sortOrder asli dari backend),
  // bukan dipindah ke awal/akhir.
  expandedGroups = signal<Set<string>>(new Set());
  sidebarEntries = computed<SidebarEntry[]>(() => {
    const items = this.menus();
    const entries: SidebarEntry[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const group = SIDEBAR_GROUPS.find((g) => item.menuRoute.startsWith(g.routePrefix + '/'));
      if (!group) {
        entries.push({ kind: 'item', item });
        continue;
      }
      if (seen.has(group.label)) continue;
      seen.add(group.label);
      const children = items.filter((i) => i.menuRoute.startsWith(group.routePrefix + '/'));
      entries.push({ kind: 'group', config: group, children });
    }
    return entries;
  });

  toggleGroup(label: string): void {
    const next = new Set(this.expandedGroups());
    if (next.has(label)) next.delete(label); else next.add(label);
    this.expandedGroups.set(next);
  }
  isGroupExpanded(label: string): boolean { return this.expandedGroups().has(label); }

  currentOrgID = signal<number | undefined>(undefined);
  orgOptions = signal<MeOrganization[]>([]);
  orgSearch = signal('');

  // Default terbuka di desktop (>900px, cocok dengan breakpoint CSS-nya),
  // tertutup di mobile (overlay, harus dibuka manual lewat hamburger) —
  // dievaluasi sekali saat komponen dibuat, tidak disinkronkan ulang saat
  // resize (pengguna bebas toggle manual setelahnya di lebar layar manapun).
  sidebarOpen = signal(window.innerWidth > MOBILE_BREAKPOINT);
  dropdownOpen = signal(false);
  orgDropdownOpen = signal(false);
  year = new Date().getFullYear();

  currentOrgName = computed(() => this.orgOptions().find((o) => o.organizationID === this.currentOrgID())?.organizationName);

  ngOnInit(): void {
    this.tier.set((this.route.snapshot.data['tier'] as Tier) ?? 'FSLDK');
    this.permissionRepo.getMenus().subscribe({ next: (m) => this.allMenus.set(m), error: () => {} });

    // Grup sidebar yang memuat route aktif saat load pertama langsung
    // terbuka, supaya pengguna tidak "kehilangan" halaman yang sedang
    // dibuka di balik dropdown tertutup.
    const currentUrl = this.router.url;
    const activeGroup = SIDEBAR_GROUPS.find((g) => currentUrl.startsWith(g.routePrefix + '/'));
    if (activeGroup) this.expandedGroups.set(new Set([activeGroup.label]));

    if (this.showOrgSwitcher()) {
      this.orgContext.organizationID$(this.route).subscribe((id) => {
        this.currentOrgID.set(id);
        this.loadOrgOptions();
      });
    }
  }

  private loadOrgOptions(): void {
    const q = this.orgSearch().trim();
    this.orgRepo.switcherList(this.tier(), q ? undefined : this.currentOrgID(), q || undefined).subscribe({
      next: (list) => {
        this.orgOptions.set(list);
        // Belum ada organizationID eksplisit di URL (mis. baru pindah ke shell
        // ini dari dropdown akun) — jangan biarkan switcher "lepas" menampilkan
        // placeholder "Pilih Organisasi" (miss-development-prompt-3.md poin 2),
        // langsung kunci ke organisasi pertama yang tersedia lewat URL supaya
        // seluruh halaman (dashboard, kader, dst.) konsisten ikut ter-scope.
        if (this.currentOrgID() === undefined && list.length > 0) {
          this.selectOrganization(list[0].organizationID);
        }
      },
      error: () => {},
    });
  }

  onOrgSearch(event: Event): void {
    this.orgSearch.set((event.target as HTMLInputElement).value);
    this.loadOrgOptions();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.dropdownOpen.set(false);
    this.orgDropdownOpen.set(false);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update((v) => !v);
  }

  openDropdown(): void { this.dropdownOpen.set(true); }
  closeDropdown(): void { this.dropdownOpen.set(false); }

  toggleOrgDropdown(event: Event): void {
    event.stopPropagation();
    this.orgDropdownOpen.update((v) => !v);
  }

  closeAllDropdowns(): void {
    this.dropdownOpen.set(false);
    this.orgDropdownOpen.set(false);
  }

  selectOrganization(id: number): void {
    this.orgDropdownOpen.set(false);
    this.router.navigate([], { queryParams: { organizationID: id }, queryParamsHandling: 'merge' });
  }

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  }

  toggle(): void { this.sidebarOpen.update((v) => !v); }
  // Hanya auto-tutup saat navigasi di lebar mobile (sidebar overlay) — di
  // desktop sidebar mendorong konten, jadi ikut tertutup tiap klik menu
  // justru mengganggu, bukan membantu.
  close(): void { if (window.innerWidth <= MOBILE_BREAKPOINT) this.sidebarOpen.set(false); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
