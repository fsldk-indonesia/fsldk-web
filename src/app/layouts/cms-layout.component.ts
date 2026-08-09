import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { PermissionRepository } from '../modules/permission/repositories/permission.repository';
import { MenuItem } from '../modules/permission/entities/menu-item';
import { IconComponent } from '../shared/icon.component';

/**
 * Layout CMS: sidebar terang dengan menu dinamis dari API (/me/menus),
 * ditambah item "Dashboard" yang selalu tampil (hardcode) sesuai TechSpec.
 * Ikon per item memakai `menuIcon` yang sudah dikirim backend
 * (lk_permission.menuIcon) lewat <app-icon>, bukan bullet polos.
 */
@Component({
  selector: 'app-cms-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="cms">
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="side-brand">
          <span class="brand-icon"><img src="assets/logo-fsldk.svg" alt="Logo FSLDK"></span>
          <span>FSLDK <b>CMS</b></span>
        </div>
        <nav class="side-nav">
          <a routerLink="/cms/dashboard" routerLinkActive="active" (click)="close()">
            <span class="icon-badge sm icon-badge-soft"><app-icon name="dashboard" [size]="17" /></span> Dashboard
          </a>
          @for (m of menus(); track m.menuRoute) {
            <a [routerLink]="m.menuRoute" routerLinkActive="active" (click)="close()">
              <span class="icon-badge sm icon-badge-soft"><app-icon [name]="m.menuIcon" [size]="17" /></span> {{ m.menuLabel }}
            </a>
          }
        </nav>
      </aside>

      <div class="cms-main">
        <header class="topbar">
          <button class="hamburger" (click)="toggle()" aria-label="Menu">&#9776;</button>
          <div class="spacer"></div>
          <a routerLink="/" class="nav-website-link">
            <span class="icon-badge sm icon-badge-neutral"><app-icon name="globe" [size]="15" /></span>
            Website
          </a>
          <div class="user-dropdown">
            <button class="user-chip" type="button" (click)="toggleDropdown($event)">
              <span class="avatar">{{ initials() }}</span>
              <div class="user-meta">
                <strong>{{ auth.user()?.fullName }}</strong>
                <small>{{ auth.user()?.role }}</small>
              </div>
              <span class="caret">&#9662;</span>
            </button>
            @if (dropdownOpen()) {
              <div class="dropdown-panel">
                <button type="button" (click)="logout()"><app-icon name="log-out" [size]="16" />Keluar</button>
              </div>
            }
          </div>
        </header>
        <main class="cms-content"><router-outlet /></main>
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
    .cms { min-height: 100dvh; background: var(--color-bg-warm); }
    /* Sidebar terang mengikuti arah "Kolektif Cerah" light-first — status aktif
       dipikul penuh oleh isian hijau solid agar wayfinding tetap kuat walau
       chrome-nya sekarang terang, bukan gelap.
       Posisinya fixed (bukan sticky di dalam flex row) supaya tingginya selalu
       penuh 100dvh terlepas dari seberapa panjang konten halaman di kanannya —
       sebelumnya sticky+flex membuat sidebar "lepas" dan menyisakan area kosong
       begitu halaman (mis. form berita/artikel yang panjang) di-scroll melewati
       tinggi sidebar sendiri. */
    .sidebar { width: 260px; background: #fff; border-right: 1px solid var(--color-border); color: var(--color-text); display: flex; flex-direction: column; padding: 24px 16px; position: fixed; top: 0; left: 0; height: 100dvh; overflow-y: auto; z-index: 40; }
    .side-brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 1.2rem; padding: 8px; margin-bottom: 24px; color: var(--color-text); }
    .side-brand b { color: var(--color-primary); }
    .brand-icon { width: 36px; height: 36px; border-radius: var(--radius-xs); overflow: hidden; flex-shrink: 0; }
    .brand-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .side-nav { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .side-nav a { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: var(--radius-md); color: var(--color-text-secondary); font-weight: 600; font-size: .95rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .side-nav a:hover { background: var(--color-bg-alt); color: var(--color-text); text-decoration: none; }
    .side-nav a.active { background: var(--color-primary); color: #fff; }
    .side-nav a.active:hover { background: var(--color-primary-dark); color: #fff; }
    .side-nav a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    /* Ikon di item aktif: lingkaran kaca-buram di atas hijau solid, bukan
       gradasi terang yang justru tenggelam di latar hijau. */
    .side-nav a.active .icon-badge { background: rgba(255,255,255,.22); color: #fff; box-shadow: none; }
    .cms-main { margin-left: 260px; display: flex; flex-direction: column; min-width: 0; min-height: 100dvh; }
    .topbar { display: flex; align-items: center; gap: 16px; padding: 16px 28px; background: #fff; border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 20; }
    .spacer { flex: 1; }
    .hamburger { display: none; background: none; border: none; font-size: 1.4rem; cursor: pointer; }
    .nav-website-link { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: var(--radius-xs); color: var(--color-text-secondary); font-weight: 600; font-size: .9rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .nav-website-link:hover { background: var(--color-bg-warm); color: var(--color-primary-dark); text-decoration: none; }
    .nav-website-icon { flex-shrink: 0; }
    .user-dropdown { position: relative; }
    .user-chip { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; padding: 6px 8px; border-radius: var(--radius-xs); font-family: var(--font-body); transition: background var(--motion-fast) ease; }
    .user-chip:hover { background: var(--color-bg-warm); }
    .user-meta { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
    .user-meta small { color: var(--color-muted); font-size: .78rem; }
    .caret { font-size: .7rem; color: var(--color-muted); }
    .dropdown-panel { position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 200px; padding: 8px; display: flex; flex-direction: column; z-index: 30; }
    .dropdown-panel a, .dropdown-panel button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px 12px; border-radius: var(--radius-xs); border: none; background: none; cursor: pointer; font-family: var(--font-body); font-size: .9rem; color: var(--color-text); transition: background var(--motion-fast) ease; }
    .dropdown-panel svg { opacity: .7; flex-shrink: 0; }
    .dropdown-panel a:hover, .dropdown-panel button:hover { background: var(--color-bg-warm); text-decoration: none; }
    .cms-content { padding: 32px 28px; flex: 1; }
    .cms-footer { padding: 0 28px 28px; }
    .cms-footer-inner { background: var(--color-bg-alt); border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-lg); padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; font-size: .85rem; color: var(--color-text-secondary); }
    @media (max-width: 900px) {
      .sidebar { z-index: 60; transform: translateX(-100%); transition: transform var(--motion-slow) var(--ease-out); box-shadow: var(--shadow-lg); }
      .sidebar.open { transform: none; }
      .hamburger { display: block; color: var(--color-text); }
      .cms-main { margin-left: 0; }
    }
  `],
})
export class CmsLayoutComponent implements OnInit {
  auth = inject(AuthRepository);
  private permissionRepo = inject(PermissionRepository);
  private router = inject(Router);

  menus = signal<MenuItem[]>([]);
  sidebarOpen = signal(false);
  dropdownOpen = signal(false);
  year = new Date().getFullYear();

  ngOnInit(): void {
    this.permissionRepo.getMenus().subscribe({ next: (m) => this.menus.set(m), error: () => {} });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.dropdownOpen.set(false);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update((v) => !v);
  }

  initials(): string {
    const name = this.auth.user()?.fullName ?? '';
    return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  }

  toggle(): void { this.sidebarOpen.update((v) => !v); }
  close(): void { this.sidebarOpen.set(false); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
