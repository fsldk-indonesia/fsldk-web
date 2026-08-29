import { CampaignDetail } from '../../entities/campaign';
import { BankListItem } from '../../entities/withdrawal';

export interface KantongAmalCampaignFormView {
  setLoading(loading: boolean): void;
  setSaving(saving: boolean): void;
  setCampaign(campaign: CampaignDetail | null): void;
  setBanks(banks: BankListItem[]): void;
  onSaveSuccess(campaign: CampaignDetail): void;
  onSubmitSuccess(): void;
}
