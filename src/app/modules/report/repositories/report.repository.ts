import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ReportApiService } from '../services/report-api.service';
import { ExportFormat } from '../entities/report';

@Injectable({ providedIn: 'root' })
export class ReportRepository {
  private api = inject(ReportApiService);

  /** Mengunduh & langsung memicu penyimpanan berkas di browser. */
  export(formCode: string, status: string | undefined, format: ExportFormat): Observable<{ blob: Blob; filename: string }> {
    return this.api.exportSubmissions(formCode, status, format).pipe(tap((result) => this.triggerDownload(result)));
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
