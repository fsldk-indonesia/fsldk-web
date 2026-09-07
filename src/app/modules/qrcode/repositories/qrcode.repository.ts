import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { QrcodeApiService, QrcodeStyleBody } from '../services/qrcode-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { QRCode } from '../entities/qrcode';

@Injectable({ providedIn: 'root' })
export class QrcodeRepository {
  private api = inject(QrcodeApiService);

  list(q: Record<string, unknown>): Observable<Pagination<QRCode>> { return this.api.list(q); }
  get(id: number): Observable<QRCode> { return this.api.get(id); }
  create(body: QrcodeStyleBody): Observable<QRCode> { return this.api.create(body); }
  update(id: number, body: QrcodeStyleBody): Observable<QRCode> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  downloadImage(id: number, size?: number): Observable<{ blob: Blob; filename: string }> { return this.api.downloadImage(id, size); }
}
