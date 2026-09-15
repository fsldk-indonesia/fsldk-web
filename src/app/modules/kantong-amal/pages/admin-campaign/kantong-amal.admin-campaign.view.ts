export interface KantongAmalAdminCampaignView {
  setBusy(id: number, busy: boolean): void;
  onActionSettled(id: number): void;
  onMutated(): void;
}
