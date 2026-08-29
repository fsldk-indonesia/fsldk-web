import { BalanceReport, CampaignReportRow, DonationReportRow, WithdrawalReportRow, WithdrawalStatusFunnel } from '../../entities/report';

export interface KantongAmalAdminReportsView {
  setLoading(loading: boolean): void;
  setExporting(exporting: boolean): void;
  setBalance(balance: BalanceReport | null): void;
  setCampaignRows(rows: CampaignReportRow[], count: number): void;
  setDonationRows(rows: DonationReportRow[], count: number): void;
  setWithdrawalRows(rows: WithdrawalReportRow[], count: number, funnel: WithdrawalStatusFunnel[]): void;
}
