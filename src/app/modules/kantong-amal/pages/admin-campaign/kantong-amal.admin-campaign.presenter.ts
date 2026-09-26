import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ToastService } from '../../../../core/services/toast.service';
import { Campaign } from '../../entities/campaign';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { KantongAmalAdminCampaignView } from './kantong-amal.admin-campaign.view';

@Injectable()
export class KantongAmalAdminCampaignPresenter extends BasePresenter<KantongAmalAdminCampaignView> {
  private campaignRepo = inject(CampaignRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — Status genuinely multi-select
   *  bermakna (backend pakai klausa IN, sama pola dengan Job Queue/Formulir
   *  Dinamis), jadi array status dikirim comma-separated apa adanya. */
  list(params: CmsListParams): Observable<Pagination<Campaign>> {
    return this.campaignRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
    });
  }

  publish(id: number): void { this.runAction(id, this.campaignRepo.publish(id)); }
  pause(id: number): void { this.runAction(id, this.campaignRepo.pause(id)); }
  resume(id: number): void { this.runAction(id, this.campaignRepo.resume(id)); }
  archive(id: number): void { this.runAction(id, this.campaignRepo.archive(id)); }

  delete(id: number): void {
    this.view.setBusy(id, true);
    this.campaignRepo.delete(id).subscribe({
      next: () => { this.toast.success('Campaign dihapus'); this.view.onMutated(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.campaignRepo.bulkDelete(ids).subscribe({
      next: (r) => {
        this.toast.success(`${r.deleted.length} campaign dihapus${r.skipped.length ? `, ${r.skipped.length} dilewati` : ''}`);
        this.view.onMutated();
      },
      error: () => {},
    });
  }

  private runAction(id: number, obs: Observable<unknown>): void {
    this.view.setBusy(id, true);
    obs.subscribe({
      next: () => { this.toast.success('Aksi berhasil disimpan'); this.view.onMutated(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }
}
