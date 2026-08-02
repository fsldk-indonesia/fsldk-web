import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { PermissionRepository } from '../modules/permission/repositories/permission.repository';
import { MenuItem } from '../modules/permission/entities/menu-item';

/**
 * Layout CMS: sidebar gelap dengan menu dinamis dari API (/me/menus),
 * ditambah item "Dashboard" yang selalu tampil (hardcode) sesuai TechSpec.
 */
@Component({
  selector: 'app-cms-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="cms">
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="side-brand">
          <span class="brand-icon"><img src="assets/logo-fsldk.svg" alt="Logo FSLDK"></span>
          <span>FSLDK <b>CMS</b></span>
        </div>
        <nav class="side-nav">
          <a routerLink="/cms/dashboard" routerLinkActive="active" (click)="close()">
            <span class="dot"></span> Dashboard
          </a>
          @for (m of menus(); track m.menuRoute) {
            <a [routerLink]="m.menuRoute" routerLinkActive="active" (click)="close()">
              <span class="dot"></span> {{ m.menuLabel }}
            </a>
          }
        </nav>
        <button class="side-logout" (click)="logout()">Keluar</button>
      </aside>

      <div class="cms-main">
        <header class="topbar">
          <button class="hamburger" (click)="toggle()" aria-label="Menu">&#9776;</button>
          <div class="spacer"></div>
          <div class="user-chip">
            <span class="avatar">{{ initials() }}</span>
            <div class="user-meta">
              <strong>{{ auth.user()?.fullName }}</strong>
              <small>{{ auth.user()?.role }}</small>
            </div>
          </div>
        </header>
        <main class="cms-content"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: [`
    .cms { display: flex; min-height: 100vh; background: var(--color-bg-warm); }
    .sidebar { width: 260px; background: var(--sidebar-bg); color: #fff; display: flex; flex-direction: column; padding: 24px 16px; position: sticky; top: 0; height: 100vh; }
    .side-brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 1.2rem; padding: 8px; margin-bottom: 24px; }
    .side-brand b { color: var(--color-primary-bright); }
    .brand-icon { width: 36px; height: 36px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
    .brand-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .side-nav { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .side-nav a { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 12px; color: #c9cdd1; font-weight: 600; font-size: .95rem; }
    .side-nav a:hover { background: rgba(255,255,255,.06); color: #fff; text-decoration: none; }
    .side-nav a.active { background: var(--color-primary); color: #fff; }
    .side-nav .dot { width: 7px; height: 7px; border-radius: 999px; background: currentColor; opacity: .6; }
    .side-logout { margin-top: 12px; background: rgba(255,255,255,.08); color: #fff; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600; font-family: var(--font-body); }
    .cms-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .topbar { display: flex; align-items: center; gap: 16px; padding: 16px 28px; background: #fff; border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 20; }
    .spacer { flex: 1; }
    .hamburger { display: none; background: none; border: none; font-size: 1.4rem; cursor: pointer; }
    .user-chip { display: flex; align-items: center; gap: 10px; }
    .user-meta { display: flex; flex-direction: column; line-height: 1.2; }
    .user-meta small { color: var(--color-muted); font-size: .78rem; }
    .cms-content { padding: 32px 28px; flex: 1; }
    @media (max-width: 900px) {
      .sidebar { position: fixed; z-index: 60; transform: translateX(-100%); transition: transform .2s; }
      .sidebar.open { transform: none; }
      .hamburger { display: block; }
    }
  `],
})
export class CmsLayoutComponent implements OnInit {
  auth = inject(AuthRepository);
  private permissionRepo = inject(PermissionRepository);
  private router = inject(Router);

  menus = signal<MenuItem[]>([]);
  sidebarOpen = signal(false);

  ngOnInit(): void {
    this.permissionRepo.getMenus().subscribe({ next: (m) => this.menus.set(m), error: () => {} });
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
