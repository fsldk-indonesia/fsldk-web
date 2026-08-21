import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { Organization } from '../../entities/organization';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { PuskomdaFormValue, OrganizationPuskomdaListPresenter } from './organization.puskomda-list.presenter';
import { OrganizationPuskomdaListView } from './organization.puskomda-list.view';

const emptyForm = (): PuskomdaFormValue => ({
  organizationName: '', organizationCode: '', provinceName: '', cityName: '', contactEmail: '', contactPhone: '',
});

@Component({
  selector: 'app-organization-puskomda-list-page',
  standalone: true,
  templateUrl: './organization.puskomda-list.page.html',
  imports: [FormsModule, IconComponent, ModalBackdropDirective, PaginationComponent],
  providers: [OrganizationPuskomdaListPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 480px; max-height: 86vh; display: flex; flex-direction: column; }
    .modal > h3 { flex-shrink: 0; }
    .modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding-right: 8px; }
    .modal-footer { flex-shrink: 0; padding-top: 20px; }
  `],
})
export class OrganizationPuskomdaListPage implements OnInit, OrganizationPuskomdaListView {
  private presenter = inject(OrganizationPuskomdaListPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

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
  form: PuskomdaFormValue = emptyForm();

  canCreate = this.auth.hasPermission('organization.create');
  canDeactivate = this.auth.hasPermission('organization.deactivate');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search); }
  applySearch(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.form = emptyForm();
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }
  save(): void { this.presenter.create(this.form); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async toggleActive(o: Organization, event?: Event): Promise<void> {
    const action = o.isActive ? 'nonaktifkan' : 'aktifkan kembali';
    const ok = await this.alert.confirm(`Yakin ingin ${action} "${o.organizationName}"?`, {
      title: o.isActive ? 'Nonaktifkan Puskomda' : 'Aktifkan Kembali Puskomda', confirmLabel: 'Ya, Lanjutkan', variant: o.isActive ? 'danger' : 'default',
    }, event);
    if (!ok) return;
    this.setBusy(o.organizationID);
    if (o.isActive) this.presenter.deactivate(o.organizationID); else this.presenter.reactivate(o.organizationID);
  }

  setOrganizations(orgs: Organization[], count: number): void { this.organizations.set(orgs); this.count.set(count); this.loading.set(false); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.showForm.set(false); this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
