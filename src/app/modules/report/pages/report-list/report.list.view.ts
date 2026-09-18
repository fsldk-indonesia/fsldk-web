import { SubmissionDetail } from '../../../submission/entities/submission';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';

export interface ReportListView {
  setVersion(version: FormVersionDetail): void;
  setDetail(detail: SubmissionDetail): void;
  /** Dipanggil presenter bila GET /submissions/:id gagal setelah modal
   *  detail sudah terbuka (state loading) — host menutup modal & mematikan
   *  skeleton, lihat report.list.page.ts. */
  onDetailError(): void;
  setExporting(exporting: boolean): void;
}
