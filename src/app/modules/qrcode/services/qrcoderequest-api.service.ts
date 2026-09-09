import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { QRCodeRequest } from '../entities/qrcode-request';
import { QRCodePIC } from '../entities/qrcode-pic';

export interface SubmitQRCodeRequestBody {
  requesterName: string;
  requesterEmail: string;
  requesterWhatsapp: string;
  destinationURL: string;
  foregroundColor?: string;
  backgroundColor?: string;
  centerIconURL?: string;
  centerIconKey?: string;
  captionText?: string;
  note?: string;
}

/** Panggilan HTTP mentah untuk permintaan QR Code (/qrcode-requests, /public/qrcode-requests). */
@Injectable({ providedIn: 'root' })
export class QrcodeRequestApiService {
  private api = inject(ApiService);

  submit(body: SubmitQRCodeRequestBody): Observable<QRCodeRequest> { return this.api.post('/public/qrcode-requests', body); }
  pic(): Observable<QRCodePIC> { return this.api.get('/public/qrcode-requests/pic', undefined, { silent: true }); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<QRCodeRequest>> { return this.api.get('/qrcode-requests', q); }
  cmsGet(id: number): Observable<QRCodeRequest> { return this.api.get(`/qrcode-requests/${id}`); }
  approve(id: number): Observable<QRCodeRequest> { return this.api.post(`/qrcode-requests/${id}/approve`); }
  reject(id: number, rejectionReason: string): Observable<unknown> { return this.api.post(`/qrcode-requests/${id}/reject`, { rejectionReason }); }
}
