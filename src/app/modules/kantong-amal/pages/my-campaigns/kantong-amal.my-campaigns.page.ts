import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Campaign } from '../../entities/campaign';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalMyCampaignsPresenter } from './kantong-amal.my-campaigns.presenter';
import { KantongAmalMyCampaignsView } from './kantong-amal.my-campaigns.view';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Diajukan', REVISION_REQUESTED: 'Perlu Revisi', APPROVED: 'Disetujui',
  PUBLISHED: 'Tayang', PAUSED: 'Dijeda', COMPLETED: 'Selesai', REJECTED: 'Ditolak', ARCHIVED: 'Diarsipkan', EXPIRED: 'Kedaluwarsa',
};

@Component({
  selector: 'app-kantong-amal-my-campaigns-page',
  standalone: true,
  templateUrl: './kantong-amal.my-campaigns.page.html',
  imports: [RouterLink, DatePipe, IconComponent, PaginationComponent],
  providers: [KantongAmalMyCampaignsPresenter],
  styles: [`
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-DRAFT, .status-REVISION_REQUESTED { background: #f3f4f6; color: #4b5563; }
    .status-SUBMITTED, .status-APPROVED { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .status-PUBLISHED { background: #dcfce7; color: #166534; }
    .status-PAUSED { background: #fef3c7; color: #92400e; }
    .status-REJECTED, .status-EXPIRED { background: #fee2e2; color: #991b1b; }
    .status-COMPLETED, .status-ARCHIVED { background: #e0e7ff; color: #3730a3; }
  `],
})
export class KantongAmalMyCampaignsPage implements OnInit, KantongAmalMyCampaignsView {
  private presenter = inject(KantongAmalMyCampaignsPresenter);

  campaigns = signal<Campaign[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 10;

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  statusLabel(status: string): string { return STATUS_LABELS[status] ?? status; }
  canEdit(status: string): boolean { return status === 'DRAFT' || status === 'REVISION_REQUESTED'; }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setCampaigns(campaigns: Campaign[], count: number): void { this.campaigns.set(campaigns); this.count.set(count); }
}
