import { PendataanTab } from '../../entities/report';

export interface ReportPendataanSensusKaderView {
  setTabs(tabs: PendataanTab[]): void;
  setLoading(loading: boolean): void;
  setExporting(exporting: boolean): void;
}
