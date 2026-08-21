import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ExportFormat } from '../entities/report';

/** Panggilan HTTP mentah untuk ekspor laporan (/reports) — respons berupa berkas, bukan amplop JSON. */
@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private api = inject(ApiService);

  exportSubmissions(formCode: string, status: string | undefined, format: ExportFormat, organizationID?: number): Observable<{ blob: Blob; filename: string }> {
    return this.api.getBlob('/reports/submissions/export', { formCode, status, format, organizationID });
  }
}
