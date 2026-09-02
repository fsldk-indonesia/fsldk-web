import { Campaign } from '../../entities/campaign';

export interface KantongAmalAdminCampaignView {
  setLoading(loading: boolean): void;
  setCampaigns(campaigns: Campaign[], count: number): void;
  setBusy(id: number, busy: boolean): void;
  onActionSuccess(): void;
  onDeleteSuccess(): void;
}
