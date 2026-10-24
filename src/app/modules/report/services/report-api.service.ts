import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { ExportFormat, ReportFilterValue, ReportSubmissionRow, PendataanTab } from '../entities/report';

function toQuery(filter: ReportFilterValue, organizationID?: number) {
  return {
    status: filter.statuses, province: filter.provinces, city: filter.cities,
    parentOrganizationID: filter.puskomdaIDs, level: filter.levelCodes,
    dateFrom: filter.dateFrom || undefined, dateTo: filter.dateTo || undefined,
    organizationID,
  };
}

/** Panggilan HTTP mentah untuk Laporan Levelisasi/Pendataan (/reports) — export
 *  mengembalikan berkas mentah, list mengembalikan amplop JSON biasa. */
@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private api = inject(ApiService);

  listLevelisasi(filter: ReportFilterValue, page: number, limit: number, sort: string, organizationID?: number): Observable<Pagination<ReportSubmissionRow>> {
    return this.api.get('/reports/levelisasi', { ...toQuery(filter, organizationID), page, limit, sort: sort || undefined });
  }

  exportLevelisasi(filter: ReportFilterValue, format: ExportFormat, organizationID?: number): Observable<{ blob: Blob; filename: string }> {
    return this.api.getBlob('/reports/levelisasi/export', { ...toQuery(filter, organizationID), format });
  }

  listPendataan(filter: ReportFilterValue, organizationID?: number): Observable<PendataanTab[]> {
    return this.api.get('/reports/pendataan', toQuery(filter, organizationID));
  }

  exportPendataan(filter: ReportFilterValue, format: ExportFormat, organizationID?: number): Observable<{ blob: Blob; filename: string }> {
    return this.api.getBlob('/reports/pendataan/export', { ...toQuery(filter, organizationID), format });
  }
}
