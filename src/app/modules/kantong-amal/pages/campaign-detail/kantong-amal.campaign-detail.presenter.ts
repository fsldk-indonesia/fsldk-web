import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { DonationRepository } from '../../repositories/donation.repository';
import { KantongAmalCampaignDetailView } from './kantong-amal.campaign-detail.view';

@Injectable()
export class KantongAmalCampaignDetailPresenter extends BasePresenter<KantongAmalCampaignDetailView> {
  private campaignRepo = inject(CampaignRepository);
  private donationRepo = inject(DonationRepository);

  load(slug: string): void {
    this.view.setLoading(true);
    this.campaignRepo.publicDetail(slug).subscribe({
      next: (campaign) => {
        this.view.setCampaign(campaign);
        this.view.setLoading(false);
      },
      error: () => { this.view.setCampaign(null); this.view.setLoading(false); },
    });
    // Donor terbaru dimuat terpisah — kegagalannya (mis. belum ada donasi)
    // tidak boleh menghalangi tampilnya konten utama campaign. Limit 50 (bukan
    // 10) karena daftar ini sekarang jadi isi penuh tab "Donatur", bukan cuma
    // cuplikan sidebar — lihat tab ala ldksyahid-app (cd-pane-donors).
    this.donationRepo.recentDonations(slug, 50).subscribe({
      next: (donations) => this.view.setRecentDonations(donations),
      error: () => this.view.setRecentDonations([]),
    });
  }
}
