import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Campaign } from '../../entities/campaign';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalAdminCampaignPresenter } from './kantong-amal.admin-campaign.presenter';
import { KantongAmalAdminCampaignView } from './kantong-amal.admin-campaign.view';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Tayang', PAUSED: 'Dijeda', COMPLETED: 'Selesai', ARCHIVED: 'Diarsipkan', EXPIRED: 'Kedaluwarsa',
  // Status lama dari alur review/submission yang sudah dihapus (revisi
  // 2026-08-30) — tetap dipetakan agar baris data lama (bila ada) tidak
  // menampilkan kode mentah, bukan lagi opsi filter aktif.
  SUBMITTED: 'Diajukan (lama)', REVISION_REQUESTED: 'Revisi (lama)', APPROVED: 'Disetujui (lama)', REJECTED: 'Ditolak (lama)',
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Tayang' },
  { value: 'PAUSED', label: 'Dijeda' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'ARCHIVED', label: 'Diarsipkan' },
];

@Component({
  selector: 'app-kantong-amal-admin-campaign-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-campaign.page.html',
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, PaginationComponent, SelectComponent],
  providers: [KantongAmalAdminCampaignPresenter],
  styles: [`
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-DRAFT { background: #f3f4f6; color: #4b5563; }
    .status-PUBLISHED { background: #dcfce7; color: #166534; }
    .status-PAUSED { background: #fef3c7; color: #92400e; }
    .status-ARCHIVED, .status-COMPLETED { background: #e0e7ff; color: #3730a3; }
    .status-EXPIRED { background: #fee2e2; color: #991b1b; }
    .status-SUBMITTED, .status-REVISION_REQUESTED, .status-APPROVED, .status-REJECTED { background: #f3f4f6; color: #4b5563; }
  `],
})
export class KantongAmalAdminCampaignPage implements OnInit, KantongAmalAdminCampaignView {
  private presenter = inject(KantongAmalAdminCampaignPresenter);
  private alert = inject(AlertService);
  private toast = inject(ToastService);

  campaigns = signal<Campaign[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 10;
  status = '';
  busyIDs = signal<Set<number>>(new Set());

  readonly formatRupiah = formatRupiah;
  readonly statusOptions = STATUS_OPTIONS;
  readonly kantongAmalPath = kantongAmalPath;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.status); }
  applyFilter(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  isBusy(id: number): boolean { return this.busyIDs().has(id); }

  async publish(c: Campaign, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Publish campaign "${c.title}"? Campaign akan langsung tayang di halaman publik.`, {}, event);
    if (ok) this.presenter.publish(c.campaignID);
  }

  async pause(c: Campaign, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Jeda campaign "${c.title}"? Campaign berhenti menerima donasi baru sampai dilanjutkan.`, {}, event);
    if (ok) this.presenter.pause(c.campaignID);
  }

  resume(c: Campaign): void { this.presenter.resume(c.campaignID); }

  async archive(c: Campaign, event: Event): Promise<void> {
    const ok = await this.alert.confirm(`Arsipkan campaign "${c.title}"? Campaign tidak lagi tampil di halaman publik.`, { variant: 'danger' }, event);
    if (ok) this.presenter.archive(c.campaignID);
  }

  async delete(c: Campaign, event: Event): Promise<void> {
    if (c.hasDonations) {
      this.toast.error('Campaign yang sudah punya donasi tidak dapat dihapus.');
      return;
    }
    const ok = await this.alert.confirm(`Hapus campaign "${c.title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`, { variant: 'danger' }, event);
    if (ok) this.presenter.delete(c.campaignID);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setCampaigns(campaigns: Campaign[], count: number): void { this.campaigns.set(campaigns); this.count.set(count); }
  setBusy(id: number, busy: boolean): void {
    const next = new Set(this.busyIDs());
    if (busy) next.add(id); else next.delete(id);
    this.busyIDs.set(next);
  }
  onActionSuccess(): void { this.toast.success('Aksi berhasil disimpan.'); this.load(); }
  onDeleteSuccess(): void { this.toast.success('Campaign berhasil dihapus.'); this.load(); }
}
