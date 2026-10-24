import { PendataanTab } from '../../entities/report';

export interface ReportPendataanView {
  setTabs(tabs: PendataanTab[]): void;
  setLoading(loading: boolean): void;
  setExporting(exporting: boolean): void;
}
