import { DashboardSummary } from '../../entities/dashboard-summary';

export interface DashboardIndexView {
  setSummary(summary: DashboardSummary): void;
  setLoading(loading: boolean): void;
}
