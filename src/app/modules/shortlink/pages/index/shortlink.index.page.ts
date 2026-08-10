import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ShortLink } from '../../entities/shortlink';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { ShortlinkFormValue, ShortlinkIndexPresenter } from './shortlink.index.presenter';
import { ShortlinkIndexView } from './shortlink.index.view';

@Component({
  selector: 'app-shortlink-index-page',
  standalone: true,
  templateUrl: './shortlink.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, PaginationComponent],
  providers: [ShortlinkIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .key { background: var(--color-bg-alt); padding: 4px 8px; border-radius: 6px; font-size: .85rem; }
    .destination { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 460px; }
  `],
})
export class ShortlinkIndexPage implements OnInit, ShortlinkIndexView {
  private presenter = inject(ShortlinkIndexPresenter);
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);
  private alert = inject(AlertService);

  shortlinks = signal<ShortLink[]>([]);
  loading = signal(true);
  search = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  showForm = signal(false);
  saving = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  editId: number | null = null;
  form: ShortlinkFormValue = { destinationURL: '', shortKey: '' };

  canCreate = this.auth.hasPermission('shortlink.create');
  canUpdate = this.auth.hasPermission('shortlink.update');
  canDelete = this.auth.hasPermission('shortlink.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search); }
  applySearch(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  openCreate(): void {
    this.editId = null;
    this.form = { destinationURL: '', shortKey: '' };
    this.showForm.set(true);
  }
  openEdit(s: ShortLink): void {
    this.editId = s.shortLinkID;
    this.form = { destinationURL: s.destinationURL, shortKey: s.shortKey };
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }

  save(): void {
    if (!this.form.destinationURL) { this.toast.error('URL tujuan wajib diisi'); return; }
    this.presenter.save(this.editId, this.form);
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async remove(s: ShortLink): Promise<void> {
    const ok = await this.alert.confirm(`Hapus shortlink "${s.shortKey}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Shortlink', confirmLabel: 'Ya, Hapus', variant: 'danger',
    });
    if (!ok) return;
    this.setBusy(s.shortLinkID);
    this.presenter.remove(s.shortLinkID);
  }

  copy(url: string): void {
    navigator.clipboard.writeText(url).then(
      () => this.toast.success('Tautan disalin'),
      () => this.toast.error('Gagal menyalin tautan'),
    );
  }

  setShortlinks(items: ShortLink[], count: number): void { this.shortlinks.set(items); this.count.set(count); this.loading.set(false); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
