import { Withdrawal } from '../../entities/withdrawal';

export interface KantongAmalWithdrawalDetailView {
  setLoading(loading: boolean): void;
  setWithdrawal(withdrawal: Withdrawal | null): void;
}
