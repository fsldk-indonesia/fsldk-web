import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Subscriber, BulkAddResult } from '../../entities/subscriber';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { SubscriptionIndexPresenter } from './subscription.index.presenter';
import { SubscriptionIndexView } from './subscription.index.view';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

@Component({
  selector: 'app-subscription-index-page',
  standalone: true,
  templateUrl: './subscription.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, SelectComponent, PaginationComponent, ModalBackdropDirective],
  providers: [SubscriptionIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .bulk-bar { display: flex; align-items: center; justify-content: space-between; background: var(--color-primary-soft); border-radius: var(--radius-md); padding: 10px 16px; margin-bottom: 14px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); backdrop-filter: blur(2px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: #fff; border-radius: var(--radius-lg); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 28px; }
    .modal h3 { margin: 0 0 6px; }
    .modal .text-muted { margin: 0 0 18px; font-size: .88rem; }
    .status-toggle { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
    .bulk-result { display: flex; flex-direction: column; gap: 4px; font-size: .85rem; margin-top: 10px; }
  `],
})
export class SubscriptionIndexPage implements OnInit, SubscriptionIndexView {
  private presenter = inject(SubscriptionIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private toast = inject(ToastService);

  subscribers = signal<Subscriber[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  readonly limit = 15;
  busy = signal<ReadonlySet<number>>(new Set());
  selected = signal<ReadonlySet<number>>(new Set());

  search = '';
  statusFilter = '';
  fromDate = '';
  toDate = '';
  readonly statusOptions = STATUS_OPTIONS;

  canCreate = this.auth.hasPermission('subscription.create');
  canDelete = this.auth.hasPermission('subscription.delete');

  showAddModal = signal(false);
  addEmails = '';
  addBusy = signal(false);

  editingSubscriber = signal<Subscriber | null>(null);
  editEmail = '';
  editIsActive = true;
  editBusy = signal(false);

  allSelected = computed(() => this.subscribers().length > 0 && this.subscribers().every((s) => this.selected().has(s.subscriberID)));

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search, this.statusFilter, this.fromDate, this.toDate); }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  isSelected(id: number): boolean { return this.selected().has(id); }
  toggleSelect(id: number): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  toggleSelectAll(): void {
    if (this.allSelected()) { this.selected.set(new Set()); return; }
    this.selected.set(new Set(this.subscribers().map((s) => s.subscriberID)));
  }

  openAddModal(): void { this.addEmails = ''; this.showAddModal.set(true); }
  closeAddModal(): void { this.showAddModal.set(false); }
  submitAdd(): void {
    if (!this.addEmails.trim()) { this.toast.error('Isi minimal satu alamat email.'); return; }
    this.addBusy.set(true);
    this.presenter.bulkAdd(this.addEmails);
  }

  openEdit(sub: Subscriber): void {
    this.editingSubscriber.set(sub);
    this.editEmail = sub.email;
    this.editIsActive = sub.isActive;
  }
  closeEdit(): void { this.editingSubscriber.set(null); }
  submitEdit(): void {
    const sub = this.editingSubscriber();
    if (!sub || !this.editEmail.trim()) return;
    this.editBusy.set(true);
    this.presenter.update(sub.subscriberID, this.editEmail.trim(), this.editIsActive);
  }

  async remove(sub: Subscriber, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus subscriber "${sub.email}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Subscriber', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(sub.subscriberID);
    this.presenter.remove(sub.subscriberID);
  }

  async bulkRemove(event?: Event): Promise<void> {
    const ids = [...this.selected()];
    if (ids.length === 0) return;
    const ok = await this.alert.confirm(`Hapus ${ids.length} subscriber terpilih? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Subscriber Terpilih', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.bulkRemove(ids);
  }

  setSubscribers(subs: Subscriber[], count: number): void {
    this.subscribers.set(subs);
    this.count.set(count);
    this.loading.set(false);
    this.selected.set(new Set());
  }

  onBulkAddResult(result: BulkAddResult): void {
    this.showAddModal.set(false);
    const parts = [`${result.added} email berhasil ditambahkan`];
    if (result.skipped.length) parts.push(`${result.skipped.length} sudah aktif (dilewati)`);
    if (result.invalid.length) parts.push(`${result.invalid.length} format tidak valid (dilewati)`);
    if (result.added > 0) this.toast.success(parts.join(', ') + '.');
    else this.toast.error(parts.join(', ') + '.');
    this.load();
  }

  onUpdateSuccess(): void { this.editingSubscriber.set(null); this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onBulkRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
  onAddSettled(): void { this.addBusy.set(false); }
  onEditSettled(): void { this.editBusy.set(false); }
}
