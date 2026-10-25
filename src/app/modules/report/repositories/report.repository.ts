import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ReportApiService } from '../services/report-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { ExportFormat, ReportFilterValue, ReportSubmissionRow, PendataanTab, KaderFilterValue, KaderReportRow } from '../entities/report';

@Injectable({ providedIn: 'root' })
export class ReportRepository {
  private api = inject(ReportApiService);

  listLevelisasi(filter: ReportFilterValue, page: number, limit: number, sort: string, organizationID?: number): Observable<Pagination<ReportSubmissionRow>> {
    return this.api.listLevelisasi(filter, page, limit, sort, organizationID);
  }

  listPendataan(filter: ReportFilterValue, organizationID?: number): Observable<PendataanTab[]> {
    return this.api.listPendataan(filter, organizationID);
  }

  exportLevelisasi(filter: ReportFilterValue, format: ExportFormat, organizationID?: number): Observable<{ blob: Blob; filename: string }> {
    return this.api.exportLevelisasi(filter, format, organizationID).pipe(tap((r) => this.triggerDownload(r)));
  }

  exportPendataan(filter: ReportFilterValue, format: ExportFormat, organizationID?: number): Observable<{ blob: Blob; filename: string }> {
    return this.api.exportPendataan(filter, format, organizationID).pipe(tap((r) => this.triggerDownload(r)));
  }

  listSensusKader(filter: KaderFilterValue, page: number, limit: number, sort: string, organizationID?: number): Observable<Pagination<KaderReportRow>> {
    return this.api.listSensusKader(filter, page, limit, sort, organizationID);
  }

  listPendataanSensusKader(filter: KaderFilterValue, organizationID?: number): Observable<PendataanTab[]> {
    return this.api.listPendataanSensusKader(filter, organizationID);
  }

  exportSensusKader(filter: KaderFilterValue, format: ExportFormat, organizationID?: number): Observable<{ blob: Blob; filename: string }> {
    return this.api.exportSensusKader(filter, format, organizationID).pipe(tap((r) => this.triggerDownload(r)));
  }

  exportPendataanSensusKader(filter: KaderFilterValue, format: ExportFormat, organizationID?: number): Observable<{ blob: Blob; filename: string }> {
    return this.api.exportPendataanSensusKader(filter, format, organizationID).pipe(tap((r) => this.triggerDownload(r)));
  }

  private triggerDownload(result: { blob: Blob; filename: string }): void {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
