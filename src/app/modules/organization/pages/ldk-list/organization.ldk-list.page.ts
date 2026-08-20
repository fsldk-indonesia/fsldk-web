import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { Organization } from '../../entities/organization';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { LdkFormValue, OrganizationLdkListPresenter } from './organization.ldk-list.presenter';
import { OrganizationLdkListView } from './organization.ldk-list.view';

const emptyForm = (): LdkFormValue => ({
  organizationName: '', organizationCode: '', provinceName: '', cityName: '', contactEmail: '', contactPhone: '', parentOrganizationID: null,
});

@Component({
  selector: 'app-organization-ldk-list-page',
  standalone: true,
  templateUrl: './organization.ldk-list.page.html',
  imports: [FormsModule, IconComponent, ModalBackdropDirective, PaginationComponent, SelectComponent],
  providers: [OrganizationLdkListPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 480px; max-height: 86vh; overflow-y: auto; }
  `],
})
export class OrganizationLdkListPage implements OnInit, OrganizationLdkListView {
  private presenter = inject(OrganizationLdkListPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private route = inject(ActivatedRoute);
  private orgContext = inject(OrgContextService);

  /** organizationID Puskomda yang sedang aktif di org-switcher shell
   *  cms-puskomda — dipakai untuk mengunci Puskomda Induk otomatis saat
   *  membuat LDK dari shell ini (miss-development-prompt-3.md poin 4) DAN
   *  untuk mempersempit daftar LDK ke Puskomda yang sedang dipilih (sebelumnya
   *  selalu menampilkan seluruh cascade accessible caller — utuh nasional
   *  untuk Puskomnas/wildcard — walau org-switcher sudah diganti). */
  private currentPuskomdaID: number | undefined;

  organizations = signal<Organization[]>([]);
  loading = signal(true);
  saving = signal(false);
  search = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  showForm = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  puskomdaOptions = signal<SelectOption[]>([]);
  form: LdkFormValue = emptyForm();

  /**
   * "Nasional" ditentukan oleh SHELL yang memuat halaman ini (cms-puskomda
   * vs cms-puskomnas — route data `tier`, diwariskan dari shell lewat
   * paramsInheritanceStrategy:'always' di app.config.ts), BUKAN identitas
   * caller. Sebelumnya berbasis identitas (organizationTypeCode/wildcard),
   * jadi akun wildcard (Super Admin) SELALU melihat picker "Puskomda Induk"
   * walau sedang berada di CMS Puskomda yang konteksnya sudah jelas — harus
   * pilih manual padahal semestinya otomatis (miss-development-prompt-3.md
   * poin 4).
   */
  isNational = computed(() => (this.route.snapshot.data['tier'] as string | undefined) === 'PUSKOMNAS');
  pageTitle = computed(() => (this.isNational() ? 'Seluruh LDK Nasional' : 'LDK Wilayah'));
  canCreate = this.auth.hasPermission('organization.create');
  canDeactivate = this.auth.hasPermission('organization.deactivate');

  ngOnInit(): void {
    this.presenter.attachView(this);
    if (this.isNational()) {
      this.load();
      this.presenter.loadPuskomdaOptions();
    } else {
      this.orgContext.organizationID$(this.route).subscribe((id) => {
        this.currentPuskomdaID = id;
        this.load();
      });
    }
  }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search, this.currentPuskomdaID); }
  applySearch(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.form = emptyForm();
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }
  save(): void {
    if (!this.isNational() && this.currentPuskomdaID) this.form.parentOrganizationID = this.currentPuskomdaID;
    this.presenter.create(this.form);
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async toggleActive(o: Organization, event?: Event): Promise<void> {
    const action = o.isActive ? 'nonaktifkan' : 'aktifkan kembali';
    const ok = await this.alert.confirm(`Yakin ingin ${action} "${o.organizationName}"?`, {
      title: o.isActive ? 'Nonaktifkan LDK' : 'Aktifkan Kembali LDK', confirmLabel: 'Ya, Lanjutkan', variant: o.isActive ? 'danger' : 'default',
    }, event);
    if (!ok) return;
    this.setBusy(o.organizationID);
    if (o.isActive) this.presenter.deactivate(o.organizationID); else this.presenter.reactivate(o.organizationID);
  }

  setOrganizations(orgs: Organization[], count: number): void { this.organizations.set(orgs); this.count.set(count); this.loading.set(false); }
  setPuskomdaOptions(options: SelectOption[]): void { this.puskomdaOptions.set(options); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.showForm.set(false); this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
