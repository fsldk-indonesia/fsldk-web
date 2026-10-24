import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { AuthRepository } from '../modules/user/repositories/auth.repository';
import { AlertService } from '../core/services/alert.service';
import { ToastService } from '../core/services/toast.service';
import { OrgContextService } from '../core/services/org-context.service';
import { OrganizationRepository } from '../modules/organization/repositories/organization.repository';
import { PermissionRepository } from '../modules/permission/repositories/permission.repository';
import { MeOrganization } from '../modules/organization/entities/organization';
import { CmsLayoutComponent } from './cms-layout.component';

describe('CmsLayoutComponent', () => {
  // Reproduksi bug nyata (2026-10-24): Super Admin membuka /cms-ldk/... TANPA
  // ?organizationID= eksplisit di URL (organizationID$ — OrgContextService —
  // tidak bisa fallback ke home org karena Super Admin tidak punya satu).
  // loadOrgOptions() lalu diam-diam memilih LDK PERTAMA di daftar switcher
  // (AS-Syahida POLBEL, organizationID 247) alih-alih LDK yang dimaksud
  // pengguna (LDK Syahid, 404) — dikonfirmasi lewat data tr_submission asli
  // di DB lokal: submission ke org 247 tercatat LEBIH DULU daripada ke org
  // 404, padahal pengguna mengira sejak awal sedang mengisi untuk LDK Syahid.
  // Tanpa toast ini, perpindahan organisasi itu sama sekali tidak kelihatan.
  const fakeOrg: MeOrganization = {
    organizationID: 247, organizationTypeCode: 'LDK',
    organizationName: 'AS-Syahida POLBEL', parentOrganizationID: 54, parentOrganizationName: 'Bangka Belitung',
  };

  function setup() {
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']);
    const switcherListSpy = jasmine.createSpy('switcherList').and.returnValue(of([fakeOrg]));

    TestBed.configureTestingModule({
      imports: [CmsLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { tier: 'LDK' } }, queryParamMap: of(convertToParamMap({})) } },
        { provide: AuthRepository, useValue: { user: signal({ organizationTypeCode: undefined, organizationID: null }), hasPermission: () => true } },
        { provide: AlertService, useValue: jasmine.createSpyObj('AlertService', ['confirm']) },
        { provide: ToastService, useValue: toastSpy },
        // OrgContextService di-stub LANGSUNG (bukan lewat AuthRepository/
        // ActivatedRoute aslinya) — skenario yang diuji di sini adalah
        // "organizationID$ tidak bisa resolve apa-apa" (Super Admin tanpa
        // home org, tanpa query param), bukan logika internal OrgContextService
        // itu sendiri (yang sudah punya cakupan tanggung jawabnya sendiri).
        { provide: OrgContextService, useValue: { organizationID$: () => of(undefined) } },
        { provide: OrganizationRepository, useValue: { switcherList: switcherListSpy } },
        { provide: PermissionRepository, useValue: { getMenus: () => of([]) } },
      ],
    });
    const fixture = TestBed.createComponent(CmsLayoutComponent);
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    return { fixture, toastSpy, switcherListSpy, navigateSpy };
  }

  it('warns the user when the org-switcher silently auto-picks an organization (no explicit org in URL)', () => {
    const { navigateSpy, toastSpy } = setup();

    // selectOrganization(247) terpanggil — konfirmasi cabang auto-pick benar jalan.
    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { organizationID: 247 } }));
    expect(toastSpy.warning).toHaveBeenCalled();
    expect(toastSpy.warning.calls.mostRecent().args[0]).toContain('AS-Syahida POLBEL');
  });
});
