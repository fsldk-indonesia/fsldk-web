import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { Campaign } from '../../entities/campaign';
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

/** Config CmsIndexConfig<Campaign> — Status genuinely multi-select bermakna
 *  (mis. lihat PUBLISHED+PAUSED sekaligus), sama pola dengan Job Queue. */
function buildCampaignIndexConfig(): CmsIndexConfig<Campaign> {
  return {
    entityLabel: 'campaign',
    guideCards: [
      { icon: 'plus', title: 'Buat Campaign', description: 'Klik <strong>"Buat Campaign"</strong> untuk mengisi cerita, target dana, dan penanggung jawab.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari judul campaign, pilih status, atau atur rentang tanggal dibuat — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat detail campaign, atau ikon pensil untuk mengubahnya.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu campaign lewat ikon tempat sampah (hanya bila belum ada donasi), atau centang beberapa baris untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Tayang' },
      { value: 'PAUSED', label: 'Dijeda' },
      { value: 'COMPLETED', label: 'Selesai' },
      { value: 'ARCHIVED', label: 'Diarsipkan' },
    ],
    searchTargets: [
      { value: 'search', label: 'Judul Campaign' },
    ],
    showDateRange: true,
    columns: [
      { key: 'title', label: 'Campaign', locked: true },
      { key: 'status', label: 'Status' },
      { key: 'targetAmount', label: 'Target' },
      { key: 'picName', label: 'PIC', sortable: false },
      { key: 'createdDate', label: 'Dibuat' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'campaignID',
    emptyIcon: 'hand-heart',
    emptyTitle: 'Belum ada campaign',
    emptyDescription: 'Campaign yang Anda buat akan muncul di sini.',
    createRoute: kantongAmalPath.campaignCreate,
    createLabel: 'Buat Campaign',
  };
}

@Component({
  selector: 'app-kantong-amal-admin-campaign-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-campaign.page.html',
  imports: [DatePipe, RouterLink, IconComponent, CmsIndexComponent],
  providers: [KantongAmalAdminCampaignPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; white-space: nowrap; }
    .status-DRAFT { background: #f3f4f6; color: #4b5563; }
    .status-PUBLISHED { background: #dcfce7; color: #166534; }
    .status-PAUSED { background: #fef3c7; color: #92400e; }
    .status-ARCHIVED, .status-COMPLETED { background: #e0e7ff; color: #3730a3; }
    .status-EXPIRED { background: #fee2e2; color: #991b1b; }
    .status-SUBMITTED, .status-REVISION_REQUESTED, .status-APPROVED, .status-REJECTED { background: #f3f4f6; color: #4b5563; }
    .table-actions { flex-wrap: wrap; row-gap: 8px; justify-content: center; }
  `],
})
export class KantongAmalAdminCampaignPage implements OnInit, KantongAmalAdminCampaignView {
  private presenter = inject(KantongAmalAdminCampaignPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private toast = inject(ToastService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Campaign>;

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;
  busyIDs = signal<Set<number>>(new Set());

  canCreate = this.auth.hasPermission('kantong_amal.campaign.create');
  canUpdate = this.auth.hasPermission('kantong_amal.campaign.update');
  canDelete = this.auth.hasPermission('kantong_amal.campaign.delete');
  canModerate = this.auth.hasPermission('kantong_amal.campaign.moderate');
  canPublish = this.auth.hasPermission('kantong_amal.campaign.publish');

  readonly config = buildCampaignIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  isBusy(id: number): boolean { return this.busyIDs().has(id); }

  viewCampaign(c: Campaign): void { this.router.navigate([this.kantongAmalPath.campaignView(c.campaignID)]); }

  async publish(c: Campaign, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.alert.confirm(`Publish campaign "${c.title}"? Campaign akan langsung tayang di halaman publik.`, {}, event);
    if (ok) this.presenter.publish(c.campaignID);
  }

  async pause(c: Campaign, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.alert.confirm(`Jeda campaign "${c.title}"? Campaign berhenti menerima donasi baru sampai dilanjutkan.`, {}, event);
    if (ok) this.presenter.pause(c.campaignID);
  }

  resume(c: Campaign, event: Event): void { event.stopPropagation(); this.presenter.resume(c.campaignID); }

  async archive(c: Campaign, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.alert.confirm(`Arsipkan campaign "${c.title}"? Campaign tidak lagi tampil di halaman publik.`, { variant: 'danger' }, event);
    if (ok) this.presenter.archive(c.campaignID);
  }

  async delete(c: Campaign, event: Event): Promise<void> {
    event.stopPropagation();
    if (c.hasDonations) {
      this.toast.error('Campaign yang sudah punya donasi tidak dapat dihapus.');
      return;
    }
    const ok = await this.alert.confirm(`Hapus campaign "${c.title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`, { variant: 'danger' }, event);
    if (ok) this.presenter.delete(c.campaignID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  setBusy(id: number, busy: boolean): void {
    const next = new Set(this.busyIDs());
    if (busy) next.add(id); else next.delete(id);
    this.busyIDs.set(next);
  }
  onActionSettled(id: number): void { this.setBusy(id, false); }
  onMutated(): void { this.table.refresh(); }
}
