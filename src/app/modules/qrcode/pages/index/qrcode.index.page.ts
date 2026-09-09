import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
import { QRCode } from '../../entities/qrcode';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { PaginationComponent } from '../../../../shared/pagination.component';
import {
  QrcodeStyleEditorComponent, QrcodeStyleValue, defaultQrcodeStyle,
} from '../../components/qrcode-style-editor/qrcode-style-editor.component';
import { QrcodeIndexPresenter } from './qrcode.index.presenter';
import { QrcodeIndexView } from './qrcode.index.view';

@Component({
  selector: 'app-qrcode-index-page',
  standalone: true,
  templateUrl: './qrcode.index.page.html',
  imports: [FormsModule, DatePipe, IconComponent, ModalBackdropDirective, PaginationComponent, QrcodeStyleEditorComponent],
  providers: [QrcodeIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .qr-thumb { width: 46px; height: 46px; border-radius: 6px; border: 1px solid var(--color-border); background: #fff; display: block; object-fit: contain; }
    .destination { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 720px; max-height: 90vh; display: flex; flex-direction: column; }
    .modal > h3 { flex-shrink: 0; }
    .modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding-right: 8px; }
    .modal-footer { flex-shrink: 0; padding-top: 20px; }
  `],
})
export class QrcodeIndexPage implements OnInit, QrcodeIndexView {
  private presenter = inject(QrcodeIndexPresenter);
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);
  private alert = inject(AlertService);

  qrcodes = signal<QRCode[]>([]);
  loading = signal(true);
  search = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  showForm = signal(false);
  saving = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  editId: number | null = null;
  form = { destinationURL: '', label: '' };
  style: QrcodeStyleValue = defaultQrcodeStyle();

  canCreate = this.auth.hasPermission('qrcode.create');
  canUpdate = this.auth.hasPermission('qrcode.update');
  canDelete = this.auth.hasPermission('qrcode.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search); }
  applySearch(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  openCreate(): void {
    this.editId = null;
    this.form = { destinationURL: '', label: '' };
    this.style = defaultQrcodeStyle();
    this.showForm.set(true);
  }
  openEdit(q: QRCode): void {
    this.editId = q.qrCodeID;
    this.form = { destinationURL: q.destinationURL, label: q.label };
    this.style = {
      foregroundColor: q.foregroundColor || defaultQrcodeStyle().foregroundColor,
      backgroundColor: q.backgroundColor || defaultQrcodeStyle().backgroundColor,
      centerIconURL: q.centerIconURL,
      centerIconKey: q.centerIconKey,
      captionText: q.captionText,
    };
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }

  save(): void {
    if (!this.form.destinationURL.trim()) { this.toast.error('URL tujuan wajib diisi'); return; }
    this.presenter.save(this.editId, { ...this.form, ...this.style });
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  async remove(q: QRCode, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus QR Code "${q.label || q.destinationURL}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus QR Code', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(q.qrCodeID);
    this.presenter.remove(q.qrCodeID);
  }

  download(q: QRCode): void { this.presenter.download(q.qrCodeID); }

  setQrcodes(items: QRCode[], count: number): void { this.qrcodes.set(items); this.count.set(count); this.loading.set(false); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.close(); this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
  saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
