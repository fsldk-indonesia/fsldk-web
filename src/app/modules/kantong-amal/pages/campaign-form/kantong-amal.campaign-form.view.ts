import { CampaignDetail } from '../../entities/campaign';

export interface KantongAmalCampaignFormView {
  setLoading(loading: boolean): void;
  setSaving(saving: boolean): void;
  setCampaign(campaign: CampaignDetail | null): void;
  onSaveSuccess(campaign: CampaignDetail): void;
}
