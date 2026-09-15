import { CampaignLite } from '../../entities/campaign';
import { AnalyticsResponse, BalanceReport, Reconciliation, WithdrawalStatusFunnel } from '../../entities/report';

export interface KantongAmalAdminReportsView {
  setLoading(loading: boolean): void;
  setExporting(exporting: boolean): void;
  setCampaigns(campaigns: CampaignLite[]): void;
  setBalance(balance: BalanceReport | null): void;
  setWithdrawalFunnel(funnel: WithdrawalStatusFunnel[]): void;
  setAnalytics(data: AnalyticsResponse | null): void;
  setReconciliation(r: Reconciliation | null): void;
}
