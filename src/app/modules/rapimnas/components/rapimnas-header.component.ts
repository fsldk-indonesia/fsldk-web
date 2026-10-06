import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { rapimnasPath } from '../rapimnas.path';

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
  imports: [RouterLink],
  template: `
    <header class="rp-header">
      <div class="rp-header-inner">
        <a [routerLink]="path.index" class="rp-brand">
          <div class="rp-brand-logos">
            <img src="assets/rapimnas/logo-fsldk.png" alt="Logo FSLDK" class="rp-brand-logo">
            <img src="assets/rapimnas/logo-insani.png" alt="Logo Insani" class="rp-brand-logo rp-brand-logo-round">
            <img src="assets/rapimnas/logo-rapimnas.png" alt="Logo RAPIMNAS" class="rp-brand-logo rp-brand-logo-round">
          </div>
          <div class="rp-brand-title">RAPIMNAS 1 FSLDK <span class="rp-accent">2026</span></div>
        </a>

        <button type="button" class="rp-burger" (click)="toggleMobileMenu()" aria-label="Toggle Menu">
          @if (mobileMenuOpen()) {
            <svg class="rp-burger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          } @else {
            <svg class="rp-burger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          }
        </button>

        <nav class="rp-nav-desktop">
          <a [routerLink]="path.index" [class.active]="isActive(path.index)">Beranda</a>
          <a [routerLink]="path.tentang" [class.active]="isActive(path.tentang)">Tentang</a>
          <a [routerLink]="path.jadwal" [class.active]="isActive(path.jadwal)">Jadwal</a>
          <a [routerLink]="path.pendaftaranPeserta" [class.active]="isPendaftaranActive()">Pendaftaran Peserta</a>
          <a [routerLink]="path.arsip" [class.active]="isActive(path.arsip)">Arsip</a>
        </nav>
      </div>

      @if (mobileMenuOpen()) {
        <div class="rp-nav-mobile">
          <a [routerLink]="path.index" [class.active]="isActive(path.index)" (click)="closeMenu()">Beranda</a>
          <a [routerLink]="path.tentang" [class.active]="isActive(path.tentang)" (click)="closeMenu()">Tentang Kami</a>
          <a [routerLink]="path.jadwal" [class.active]="isActive(path.jadwal)" (click)="closeMenu()">Jadwal Acara</a>
          <a [routerLink]="path.pendaftaranPeserta" [class.active]="isPendaftaranActive()" (click)="closeMenu()">Pendaftaran Delegasi</a>
          <a [routerLink]="path.arsip" [class.active]="isActive(path.arsip)" (click)="closeMenu()">Pusat Unduhan</a>
        </div>
      }
    </header>
  `,
  styles: [`
    .rp-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--rp-maroon) 95%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--rp-merah); }
    .rp-header-inner { max-width: 1152px; margin: 0 auto; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .rp-brand { display: flex; align-items: center; gap: 16px; text-decoration: none; }
    .rp-brand-logos { display: flex; align-items: center; gap: 8px; }
    .rp-brand-logo { width: 32px; height: 32px; object-fit: contain; }
    .rp-brand-logo-round { border-radius: 4px; }
    .rp-brand-title { display: none; font-weight: 700; font-size: 1.15rem; color: var(--rp-krem); letter-spacing: -0.01em; }
    .rp-accent { color: var(--rp-oranye); }
    .rp-burger { display: flex; color: var(--rp-krem); background: none; border: none; padding: 8px; cursor: pointer; }
    .rp-burger:hover { color: var(--rp-oranye); }
    .rp-burger-icon { width: 24px; height: 24px; }
    .rp-nav-desktop { display: none; align-items: center; gap: 32px; font-size: 0.9rem; font-weight: 500; }
    .rp-nav-desktop a { color: color-mix(in srgb, var(--rp-krem) 90%, transparent); text-decoration: none; transition: color .15s ease; }
    .rp-nav-desktop a:hover, .rp-nav-desktop a.active { color: var(--rp-oranye); font-weight: 600; }
    .rp-nav-mobile { display: flex; flex-direction: column; gap: 6px; padding: 16px; background: color-mix(in srgb, var(--rp-maroon) 95%, transparent); border-bottom: 1px solid var(--rp-merah); }
    .rp-nav-mobile a { padding: 14px 16px; border-radius: 12px; text-decoration: none; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.04em; font-weight: 600; color: color-mix(in srgb, var(--rp-krem) 90%, transparent); }
    .rp-nav-mobile a.active { background: var(--rp-merah); color: var(--rp-oranye); }
    @media (min-width: 768px) {
      .rp-brand-title { display: block; }
      .rp-burger { display: none; }
      .rp-nav-desktop { display: flex; }
      .rp-nav-mobile { display: none; }
    }
  `],
})
export class RapimnasHeaderComponent {
  private router = inject(Router);
  readonly path = rapimnasPath;

  mobileMenuOpen = signal(false);
  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.currentUrl.set(this.router.url);
    });
  }

  isActive(path: string): boolean { return this.currentUrl() === path; }
  isPendaftaranActive = computed(() => this.currentUrl().startsWith('/rapimnas/pendaftaran'));

  toggleMobileMenu(): void { this.mobileMenuOpen.update((v) => !v); }
  closeMenu(): void { this.mobileMenuOpen.set(false); }
}
