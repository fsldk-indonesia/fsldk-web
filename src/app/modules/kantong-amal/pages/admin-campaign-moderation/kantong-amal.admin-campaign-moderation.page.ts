import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Campaign, CampaignDetail } from '../../entities/campaign';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { ToastService } from '../../../../core/services/toast.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { KantongAmalAdminCampaignModerationPresenter } from './kantong-amal.admin-campaign-moderation.presenter';
import { KantongAmalAdminCampaignModerationView } from './kantong-amal.admin-campaign-moderation.view';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Diajukan', REVISION_REQUESTED: 'Perlu Revisi', APPROVED: 'Disetujui',
  PUBLISHED: 'Tayang', PAUSED: 'Dijeda', COMPLETED: 'Selesai', REJECTED: 'Ditolak', ARCHIVED: 'Diarsipkan', EXPIRED: 'Kedaluwarsa',
};

@Component({
  selector: 'app-kantong-amal-admin-campaign-moderation-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-campaign-moderation.page.html',
  imports: [DatePipe, FormsModule, IconComponent, PaginationComponent],
  providers: [KantongAmalAdminCampaignModerationPresenter],
  styles: [`
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-DRAFT, .status-REVISION_REQUESTED { background: #f3f4f6; color: #4b5563; }
    .status-SUBMITTED, .status-APPROVED { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-PUBLISHED { background: #dcfce7; color: #166534; }
    .status-PAUSED { background: #fef3c7; color: #92400e; }
    .status-REJECTED, .status-EXPIRED { background: #fee2e2; color: #991b1b; }
    .status-COMPLETED, .status-ARCHIVED { background: #e0e7ff; color: #3730a3; }
    .modal-body .story { max-height: 220px; overflow-y: auto; white-space: pre-wrap; font-size: .9rem; color: var(--color-text-secondary); background: var(--color-bg-alt); padding: 12px; border-radius: var(--radius-sm); }
    .decision-row { display: flex; gap: 8px; margin-top: 14px; }
  `],
})
export class KantongAmalAdminCampaignModerationPage implements OnInit, KantongAmalAdminCampaignModerationView {
  private presenter = inject(KantongAmalAdminCampaignModerationPresenter);
  private toast = inject(ToastService);

  campaigns = signal<Campaign[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 10;
  status = 'SUBMITTED';

  detail = signal<CampaignDetail | null>(null);
  showModal = signal(false);
  submitting = signal(false);
  note = '';

  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.status); }
  applyFilter(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }

  openDetail(c: Campaign): void {
    this.note = '';
    this.showModal.set(true);
    this.presenter.loadDetail(c.campaignID);
  }

  close(): void { this.showModal.set(false); this.detail.set(null); }

  decide(decision: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED'): void {
    const d = this.detail();
    if (!d) return;
    if (decision !== 'APPROVED' && !this.note.trim()) {
      this.toast.error('Catatan wajib diisi untuk revisi/penolakan.');
      return;
    }
    this.presenter.review(d.campaignID, { decision, note: this.note || undefined });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setCampaigns(campaigns: Campaign[], count: number): void { this.campaigns.set(campaigns); this.count.set(count); }
  setDetail(detail: CampaignDetail | null): void { this.detail.set(detail); }
  setSubmitting(submitting: boolean): void { this.submitting.set(submitting); }

  onReviewSuccess(): void {
    this.toast.success('Keputusan review berhasil disimpan.');
    this.close();
    this.load();
  }
}
