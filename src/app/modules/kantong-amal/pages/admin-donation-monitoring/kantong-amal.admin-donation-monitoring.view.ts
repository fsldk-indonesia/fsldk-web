import { Donation } from '../../entities/donation';

export interface KantongAmalAdminDonationMonitoringView {
  setLoading(loading: boolean): void;
  setDonations(donations: Donation[], count: number): void;
  setBusy(id: number, busy: boolean): void;
  onDeleteSuccess(): void;
}
