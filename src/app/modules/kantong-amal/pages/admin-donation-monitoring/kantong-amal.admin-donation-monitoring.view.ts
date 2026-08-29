import { Donation } from '../../entities/donation';

export interface KantongAmalAdminDonationMonitoringView {
  setLoading(loading: boolean): void;
  setDonations(donations: Donation[], count: number): void;
}
