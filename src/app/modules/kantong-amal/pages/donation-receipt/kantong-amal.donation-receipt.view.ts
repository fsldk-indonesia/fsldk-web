import { Donation } from '../../entities/donation';

export interface KantongAmalDonationReceiptView {
  setLoading(loading: boolean): void;
  setDonation(donation: Donation | null): void;
  setDownloading(downloading: boolean): void;
}
