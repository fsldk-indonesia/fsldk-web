import { Withdrawal } from '../../entities/withdrawal';

export interface KantongAmalAdminWithdrawalApprovalView {
  setLoading(loading: boolean): void;
  setWithdrawals(withdrawals: Withdrawal[], count: number): void;
  setBusy(id: number, busy: boolean): void;
  onActionSuccess(): void;
}
