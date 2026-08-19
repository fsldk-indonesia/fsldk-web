import { SubmissionResponse, SubmissionDetail } from '../../../submission/entities/submission';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';

export interface ReportListView {
  setRows(rows: SubmissionResponse[]): void;
  setOrgNames(names: Record<number, string>): void;
  setVersion(version: FormVersionDetail): void;
  setDetail(detail: SubmissionDetail): void;
  setLoading(loading: boolean): void;
  setExporting(exporting: boolean): void;
}
