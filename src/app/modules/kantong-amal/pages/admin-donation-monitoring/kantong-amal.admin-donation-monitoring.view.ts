export interface KantongAmalAdminDonationMonitoringView {
  setBusy(id: number, busy: boolean): void;
  onActionSettled(id: number): void;
  onMutated(): void;
}
