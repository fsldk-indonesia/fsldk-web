import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { PermissionRepository } from '../modules/permission/repositories/permission.repository';
import { OrganizationRepository } from '../modules/organization/repositories/organization.repository';
import { OrgContextService } from '../core/services/org-context.service';
import { MenuItem } from '../modules/permission/entities/menu-item';
import { MeOrganization } from '../modules/organization/entities/organization';
import { IconComponent } from '../shared/icon.component';
import { CmsTier, CMS_SHELL_BASE, CMS_SHELL_LABEL, CMS_SHELL_ICON } from '../shared/cms-tier';

type Tier = CmsTier;

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="cms" [class.tier-ldk]="tier() === 'LDK'" [class.tier-puskomda]="tier() === 'PUSKOMDA'" [class.tier-puskomnas]="tier() === 'PUSKOMNAS'">
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="side-brand">
          <span class="brand-icon"><img src="assets/logo-fsldk.svg" alt="Logo FSLDK"></span>
          <span>{{ brandLabel() }}</span>
        </div>
        <nav class="side-nav">
          <a [routerLink]="shellBase() + '/dashboard'" queryParamsHandling="preserve" routerLinkActive="active" (click)="close()" class="stagger-in" style="--stagger-i:0">
            <span class="icon-badge sm icon-badge-soft"><app-icon name="dashboard" [size]="17" /></span> Dashboard
            <span class="side-nav-dot"></span>
          </a>
          @for (m of menus(); track m.menuRoute; let i = $index) {
            <a [routerLink]="m.menuRoute" queryParamsHandling="preserve" routerLinkActive="active" (click)="close()" class="stagger-in" [style.--stagger-i]="i + 1">
              <span class="icon-badge sm icon-badge-soft"><app-icon [name]="m.menuIcon" [size]="17" /></span> {{ m.menuLabel }}
              <span class="side-nav-dot"></span>
            </a>
          }
        </nav>
      </aside>

      <div class="cms-main">
        <header class="topbar">
          <button class="hamburger" (click)="toggle()" aria-label="Menu">&#9776;</button>
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
          <a routerLink="/" class="nav-website-link">
            <span class="icon-badge sm icon-badge-neutral"><app-icon name="globe" [size]="15" /></span>
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
                  <a [routerLink]="shellBaseOf(t) + '/dashboard'" (click)="closeAllDropdowns()"><app-icon [name]="shellIconOf(t)" [size]="16" />{{ shellLabelOf(t) }}</a>
                }
                <a routerLink="/akun/profil" (click)="closeAllDropdowns()"><app-icon name="user-circle" [size]="16" />Profil Saya</a>
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
    .cms {
      min-height: 100dvh; background-color: var(--color-bg-warm);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%2300933b' stroke-width='1' stroke-opacity='.02'%3E%3Cellipse cx='24' cy='12' rx='6' ry='10'/%3E%3Cellipse cx='24' cy='36' rx='6' ry='10'/%3E%3Cellipse cx='36' cy='24' rx='10' ry='6'/%3E%3Cellipse cx='12' cy='24' rx='10' ry='6'/%3E%3Ccircle cx='24' cy='24' r='2.4' fill='%2300933b' fill-opacity='.02' stroke='none'/%3E%3C/g%3E%3C/svg%3E");
      background-size: 48px 48px;
    }
    .sidebar { width: 260px; background: #fff; border-right: 1px solid var(--color-border); color: var(--color-text); display: flex; flex-direction: column; padding: 24px 16px; position: fixed; top: 0; left: 0; height: 100dvh; overflow-y: auto; z-index: 40; }
    .side-brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; padding: 8px; margin-bottom: 24px; color: var(--color-text); }
    .brand-icon { width: 36px; height: 36px; border-radius: var(--radius-xs); overflow: hidden; flex-shrink: 0; }
    .brand-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .side-nav { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .side-nav a { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: var(--radius-md); color: var(--color-text-secondary); font-weight: 600; font-size: .95rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out); }
    .side-nav a:hover { background: var(--color-bg-alt); color: var(--color-text); text-decoration: none; transform: translateX(3px); }
    .side-nav a.active { background: var(--color-primary); color: #fff; }
    .side-nav a.active:hover { background: var(--color-primary-dark); color: #fff; transform: translateX(3px); }
    .side-nav a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    .side-nav a.active .icon-badge { background: rgba(255,255,255,.22); color: #fff; box-shadow: none; }
    .side-nav-dot { display: none; margin-left: auto; width: 6px; height: 6px; border-radius: 50%; background: var(--color-gold); flex-shrink: 0; animation: node-pulse 2.4s ease-in-out infinite; }
    .side-nav a.active .side-nav-dot { display: block; }
    .cms-main { margin-left: 260px; display: flex; flex-direction: column; min-width: 0; min-height: 100dvh; }
    .topbar { display: flex; align-items: center; gap: 16px; padding: 16px 28px; background: #fff; border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 20; }
    .spacer { flex: 1; }
    .org-switcher { position: relative; }
    .org-switcher-btn { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: var(--radius-xs); border: 1px solid var(--color-border); background: var(--color-bg-warm); color: var(--color-text); font-weight: 600; font-size: .88rem; cursor: pointer; transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .org-switcher-btn:hover { background: var(--color-primary-soft); border-color: var(--color-primary); }
    .org-switcher-btn span { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .org-dropdown-panel { left: 0; right: auto; min-width: 280px; max-height: 360px; overflow-y: auto; gap: 4px; }
    .org-dropdown-panel input { margin-bottom: 6px; }
    .org-dropdown-panel button.active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .org-empty { padding: 8px 12px; font-size: .85rem; }
    .hamburger { display: none; background: none; border: none; font-size: 1.4rem; cursor: pointer; }
    .nav-website-link { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: var(--radius-xs); color: var(--color-text-secondary); font-weight: 600; font-size: .9rem; transition: background var(--motion-fast) ease, color var(--motion-fast) ease; }
    .nav-website-link:hover { background: var(--color-bg-warm); color: var(--color-primary-dark); text-decoration: none; }
    .user-dropdown { position: relative; }
    .user-chip { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; padding: 6px 8px; border-radius: var(--radius-xs); font-family: var(--font-body); transition: background var(--motion-fast) ease; }
    .user-chip:hover { background: var(--color-bg-warm); }
    .avatar { width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; }
    img.avatar { object-fit: cover; }
    .user-meta { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
    .user-meta small { color: var(--color-muted); font-size: .78rem; }
    .caret { color: var(--color-muted); transition: transform var(--motion-fast) ease; flex-shrink: 0; }
    .caret.open { transform: rotate(180deg); }
    .dropdown-panel {
      position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 200px; padding: 8px;
      display: flex; flex-direction: column; z-index: 30;
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
    .dropdown-panel a, .dropdown-panel button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 10px 12px; border-radius: var(--radius-xs); border: none; background: none; cursor: pointer; font-family: var(--font-body); font-size: .9rem; color: var(--color-text); transition: background var(--motion-fast) ease; }
    .dropdown-panel svg, .dropdown-panel app-icon { opacity: .7; flex-shrink: 0; }
    .dropdown-panel a:hover, .dropdown-panel button:hover { background: var(--color-bg-warm); text-decoration: none; }
    .cms-content { padding: 32px 28px; flex: 1; }
    .cms-footer { padding: 0 28px 28px; }
    .cms-footer-inner { background: var(--color-bg-alt); border-radius: var(--radius-lg); padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; font-size: .85rem; color: var(--color-text-secondary); }
    @media (max-width: 900px) {
      .sidebar { z-index: 60; transform: translateX(-100%); transition: transform var(--motion-slow) var(--ease-out); box-shadow: var(--shadow-lg); }
      .sidebar.open { transform: none; }
      .hamburger { display: block; color: var(--color-text); }
      .cms-main { margin-left: 0; }
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

  shellBaseOf(t: CmsTier): string { return CMS_SHELL_BASE[t]; }
  shellLabelOf(t: CmsTier): string { return CMS_SHELL_LABEL[t]; }
  shellIconOf(t: CmsTier): string { return CMS_SHELL_ICON[t]; }

  allMenus = signal<MenuItem[]>([]);
  menus = computed(() => this.allMenus().filter((m) => m.menuRoute.startsWith(this.shellBase() + '/')));

  currentOrgID = signal<number | undefined>(undefined);
  orgOptions = signal<MeOrganization[]>([]);
  orgSearch = signal('');

  sidebarOpen = signal(false);
  dropdownOpen = signal(false);
  orgDropdownOpen = signal(false);
  year = new Date().getFullYear();

  currentOrgName = computed(() => this.orgOptions().find((o) => o.organizationID === this.currentOrgID())?.organizationName);

  ngOnInit(): void {
    this.tier.set((this.route.snapshot.data['tier'] as Tier) ?? 'FSLDK');
    this.permissionRepo.getMenus().subscribe({ next: (m) => this.allMenus.set(m), error: () => {} });

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
  close(): void { this.sidebarOpen.set(false); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
