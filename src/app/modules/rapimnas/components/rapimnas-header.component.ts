import { DOCUMENT } from '@angular/common';
import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from '../../../shared/icon.component';
import { rapimnasPath } from '../rapimnas.path';

interface RapimnasNavItem {
  label: string;
  path: string;
  icon: string;
}

/**
 * Ported from Header.tsx. The reference's `pathname.startsWith('/pendaftaran')`
 * active-state logic (shared by both Pendaftaran sub-routes even though the
 * nav link itself points only at `/pendaftaran/peserta`) can't be expressed
 * with `routerLinkActive` alone — Angular only marks a link active for its
 * OWN target segments, not sibling routes — so active state is tracked
 * manually via `router.events` instead.
 */
@Component({
  selector: 'app-rapimnas-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <header class="rp-header">
      <div class="rp-header-inner">
        <a [routerLink]="path.index" class="rp-brand">
          <div class="rp-brand-logos">
            <img src="assets/logo-fsldk-radius.png" alt="Logo FSLDK" class="rp-brand-logo">
            <img src="assets/rapimnas/logo-insani.png" alt="Logo Insani" class="rp-brand-logo rp-brand-logo-round">
            <img src="assets/rapimnas/logo-rapimnas.png" alt="Logo RAPIMNAS" class="rp-brand-logo rp-brand-logo-round">
          </div>
          <div class="rp-brand-title">RAPIMNAS 1 FSLDK <span class="rp-accent">2026</span></div>
        </a>

        <button type="button" class="rp-burger" [class.open]="mobileMenuOpen()" (click)="toggleMobileMenu()" aria-label="Toggle Menu" aria-haspopup="true" [attr.aria-expanded]="mobileMenuOpen()">
          <span class="rp-burger-box">
            <span class="rp-burger-bar"></span>
            <span class="rp-burger-bar"></span>
            <span class="rp-burger-bar"></span>
          </span>
        </button>

        <nav class="rp-nav-desktop">
          <a [routerLink]="path.index" [class.active]="isActive(path.index)">Beranda</a>
          <a [routerLink]="path.tentang" [class.active]="isActive(path.tentang)">Tentang</a>
          <a [routerLink]="path.jadwal" [class.active]="isActive(path.jadwal)">Jadwal</a>
          <a [routerLink]="path.pendaftaranPeserta" [class.active]="isPendaftaranActive()">Pendaftaran Peserta</a>
          <a [routerLink]="path.arsip" [class.active]="isActive(path.arsip)">Arsip</a>
        </nav>
      </div>
    </header>

    <div class="rp-drawer-backdrop" [class.open]="mobileMenuOpen()" (click)="closeMenu()" aria-hidden="true"></div>

    <aside class="rp-drawer" [class.open]="mobileMenuOpen()" aria-label="Menu navigasi">
      <div class="rp-drawer-head">
        <span class="rp-drawer-title">Menu</span>
        <button type="button" class="rp-drawer-close" (click)="closeMenu()" aria-label="Tutup menu">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <nav class="rp-drawer-nav">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" [class.active]="isNavItemActive(item)" (click)="closeMenu()" class="rp-drawer-link">
            <span class="rp-drawer-link-icon"><app-icon [name]="item.icon" [size]="16" /></span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .rp-header { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: color-mix(in srgb, var(--rp-maroon) 95%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--rp-merah); }
    .rp-header-inner { max-width: 1152px; margin: 0 auto; padding: 16px; display: flex; align-items: center; justify-content: space-between; }
    .rp-brand { display: flex; align-items: center; gap: 16px; text-decoration: none; }
    .rp-brand-logos { display: flex; align-items: center; gap: 8px; transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-brand:hover .rp-brand-logos { opacity: 0.8; }
    .rp-brand-logo { width: 32px; height: 32px; object-fit: contain; }
    .rp-brand-logo-round { border-radius: 2px; }
    .rp-brand-title { display: none; font-weight: 700; font-size: 1.25rem; color: var(--rp-krem); letter-spacing: -0.025em; }
    .rp-accent { color: var(--rp-oranye); }
    .rp-burger { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; color: var(--rp-krem); background: none; border: none; padding: 0; cursor: pointer; transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-burger:hover { color: var(--rp-oranye); }
    .rp-burger:focus { outline: none; }
    .rp-burger-box { position: relative; width: 22px; height: 16px; }
    .rp-burger-bar { position: absolute; left: 0; width: 100%; height: 2px; border-radius: 2px; background: currentColor; transition: transform 350ms cubic-bezier(0.65, 0, 0.35, 1), opacity 200ms ease; }
    .rp-burger-bar:nth-child(1) { top: 0; }
    .rp-burger-bar:nth-child(2) { top: 7px; }
    .rp-burger-bar:nth-child(3) { top: 14px; }
    .rp-burger.open .rp-burger-bar:nth-child(1) { top: 7px; transform: rotate(45deg); }
    .rp-burger.open .rp-burger-bar:nth-child(2) { opacity: 0; }
    .rp-burger.open .rp-burger-bar:nth-child(3) { top: 7px; transform: rotate(-45deg); }
    .rp-nav-desktop { display: none; align-items: center; gap: 32px; font-size: 0.875rem; font-weight: 500; }
    .rp-nav-desktop a { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); text-decoration: none; transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1); }
    .rp-nav-desktop a:hover { color: var(--rp-oranye); }
    .rp-nav-desktop a.active { color: var(--rp-oranye); font-weight: 600; }
    .rp-drawer-backdrop { position: fixed; inset: 0; z-index: 55; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(2px); opacity: 0; pointer-events: none; transition: opacity 350ms ease; }
    .rp-drawer-backdrop.open { opacity: 1; pointer-events: auto; }
    .rp-drawer { position: fixed; top: 0; right: 0; z-index: 60; width: min(84vw, 320px); height: 100dvh; display: flex; flex-direction: column; background: color-mix(in srgb, var(--rp-maroon) 97%, transparent); backdrop-filter: blur(24px); border-left: 1px solid var(--rp-merah); box-shadow: -24px 0 60px rgba(0, 0, 0, 0.45); transform: translateX(100%); transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1); }
    .rp-drawer.open { transform: translateX(0); }
    .rp-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid color-mix(in srgb, var(--rp-merah) 60%, transparent); }
    .rp-drawer-title { color: color-mix(in srgb, var(--rp-krem) 70%, transparent); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
    .rp-drawer-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: none; border: none; color: var(--rp-krem); cursor: pointer; transition: background-color 200ms ease, color 200ms ease; }
    .rp-drawer-close:hover { background: color-mix(in srgb, var(--rp-merah) 40%, transparent); color: var(--rp-oranye); }
    .rp-drawer-close svg { width: 18px; height: 18px; }
    .rp-drawer-nav { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding: 12px; }
    .rp-drawer-link {
      display: flex; align-items: center; gap: 14px; padding: 13px 14px; border-radius: 14px; text-decoration: none;
      font-size: 0.9rem; font-weight: 600; color: color-mix(in srgb, var(--rp-krem) 90%, transparent);
      transition-property: opacity, transform, background-color, color;
      transition-duration: 380ms, 380ms, 200ms, 200ms;
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), ease, ease;
      opacity: 0; transform: translateX(18px);
    }
    .rp-drawer-link-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px; background: color-mix(in srgb, var(--rp-merah) 25%, transparent); color: var(--rp-oranye); transition: background-color 200ms ease, color 200ms ease; }
    .rp-drawer-link:active { background: color-mix(in srgb, var(--rp-merah) 35%, transparent); }
    .rp-drawer-link.active { background: var(--rp-merah); color: var(--rp-oranye); }
    .rp-drawer-link.active .rp-drawer-link-icon { background: var(--rp-oranye); color: var(--rp-maroon); }
    .rp-drawer.open .rp-drawer-link { opacity: 1; transform: none; }
    .rp-drawer.open .rp-drawer-link:nth-child(1) { transition-delay: 80ms, 80ms, 0ms, 0ms; }
    .rp-drawer.open .rp-drawer-link:nth-child(2) { transition-delay: 130ms, 130ms, 0ms, 0ms; }
    .rp-drawer.open .rp-drawer-link:nth-child(3) { transition-delay: 180ms, 180ms, 0ms, 0ms; }
    .rp-drawer.open .rp-drawer-link:nth-child(4) { transition-delay: 230ms, 230ms, 0ms, 0ms; }
    .rp-drawer.open .rp-drawer-link:nth-child(5) { transition-delay: 280ms, 280ms, 0ms, 0ms; }
    @media (min-width: 768px) {
      .rp-brand-title { display: block; }
      .rp-burger { display: none; }
      .rp-nav-desktop { display: flex; }
      .rp-drawer, .rp-drawer-backdrop { display: none; }
    }
  `],
})
export class RapimnasHeaderComponent implements OnDestroy {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  readonly path = rapimnasPath;

  readonly navItems: RapimnasNavItem[] = [
    { label: 'Beranda', path: rapimnasPath.index, icon: 'home' },
    { label: 'Tentang Kami', path: rapimnasPath.tentang, icon: 'info' },
    { label: 'Jadwal Acara', path: rapimnasPath.jadwal, icon: 'calendar' },
    { label: 'Pendaftaran Delegasi', path: rapimnasPath.pendaftaranPeserta, icon: 'user-plus' },
    { label: 'Pusat Unduhan', path: rapimnasPath.arsip, icon: 'archive' },
  ];

  mobileMenuOpen = signal(false);
  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.currentUrl.set(this.router.url);
    });
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  isActive(path: string): boolean { return this.currentUrl() === path; }
  isPendaftaranActive = computed(() => this.currentUrl().startsWith('/rapimnas/pendaftaran'));

  isNavItemActive(item: RapimnasNavItem): boolean {
    return item.path === this.path.pendaftaranPeserta ? this.isPendaftaranActive() : this.isActive(item.path);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileMenuOpen()) this.closeMenu();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
    this.syncBodyScroll();
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
    this.syncBodyScroll();
  }

  private syncBodyScroll(): void {
    this.document.body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
  }
}
