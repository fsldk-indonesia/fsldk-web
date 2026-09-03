import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { KantongAmalAdminCampaignView } from './kantong-amal.admin-campaign.view';

@Injectable()
export class KantongAmalAdminCampaignPresenter extends BasePresenter<KantongAmalAdminCampaignView> {
  private campaignRepo = inject(CampaignRepository);

  load(page: number, limit: number, status: string): void {
    this.view.setLoading(true);
    this.campaignRepo.cmsList({ page, limit, status: status || undefined }).subscribe({
      next: (p) => { this.view.setCampaigns(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  publish(id: number): void { this.runAction(id, this.campaignRepo.publish(id)); }
  pause(id: number): void { this.runAction(id, this.campaignRepo.pause(id)); }
  resume(id: number): void { this.runAction(id, this.campaignRepo.resume(id)); }
  archive(id: number): void { this.runAction(id, this.campaignRepo.archive(id)); }

  delete(id: number): void {
    this.view.setBusy(id, true);
    this.campaignRepo.delete(id).subscribe({
      next: () => { this.view.setBusy(id, false); this.view.onDeleteSuccess(); },
      error: () => this.view.setBusy(id, false),
    });
  }

  private runAction(id: number, obs: Observable<unknown>): void {
    this.view.setBusy(id, true);
    obs.subscribe({
      next: () => { this.view.setBusy(id, false); this.view.onActionSuccess(); },
      error: () => this.view.setBusy(id, false),
    });
  }
}
