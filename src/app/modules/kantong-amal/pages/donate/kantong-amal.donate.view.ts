import { CampaignDetail } from '../../entities/campaign';

export interface KantongAmalDonateView {
  setLoading(loading: boolean): void;
  setSubmitting(submitting: boolean): void;
  setCampaign(campaign: CampaignDetail | null): void;
  onSubmitSuccess(publicRef: string): void;
}
