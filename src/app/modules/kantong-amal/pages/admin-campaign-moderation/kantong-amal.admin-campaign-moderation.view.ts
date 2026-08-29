import { Campaign, CampaignDetail } from '../../entities/campaign';

export interface KantongAmalAdminCampaignModerationView {
  setLoading(loading: boolean): void;
  setCampaigns(campaigns: Campaign[], count: number): void;
  setDetail(detail: CampaignDetail | null): void;
  setSubmitting(submitting: boolean): void;
  onReviewSuccess(): void;
}
