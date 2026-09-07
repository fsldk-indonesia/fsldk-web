import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { QRCode } from '../entities/qrcode';

/** Field kustomisasi gambar QR yang dikirim saat create/update. */
export interface QrcodeStyleBody {
  destinationURL: string;
  label?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  centerIconURL?: string;
  centerIconKey?: string;
  captionText?: string;
}

/** Panggilan HTTP mentah untuk manajemen QR Code (/qrcodes). */
@Injectable({ providedIn: 'root' })
export class QrcodeApiService {
  private api = inject(ApiService);

  list(q: Record<string, unknown>): Observable<Pagination<QRCode>> { return this.api.get('/qrcodes', q); }
  get(id: number): Observable<QRCode> { return this.api.get(`/qrcodes/${id}`); }
  create(body: QrcodeStyleBody): Observable<QRCode> { return this.api.post('/qrcodes', body); }
  update(id: number, body: QrcodeStyleBody): Observable<QRCode> { return this.api.put(`/qrcodes/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/qrcodes/${id}`); }

  /** Unduh gambar PNG QR sebagai blob (tombol "Unduh PNG" di CMS). */
  downloadImage(id: number, size = 1024): Observable<{ blob: Blob; filename: string }> {
    return this.api.getBlob(`/public/qrcodes/${id}/image`, { size });
  }
}
