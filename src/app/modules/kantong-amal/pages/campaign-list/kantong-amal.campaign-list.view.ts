import { Campaign, CampaignCategory } from '../../entities/campaign';

export interface KantongAmalCampaignListView {
  setLoading(loading: boolean): void;
  setCampaigns(campaigns: Campaign[], count: number): void;
  setCategories(categories: CampaignCategory[]): void;
}
