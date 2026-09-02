import { Donation } from '../../entities/donation';

export interface KantongAmalPaymentStatusView {
  setLoading(loading: boolean): void;
  setDonation(donation: Donation | null): void;
}
