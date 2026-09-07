import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { QrcodeRequestApiService, SubmitQRCodeRequestBody } from '../services/qrcoderequest-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { QRCodeRequest } from '../entities/qrcode-request';
import { QRCodePIC } from '../entities/qrcode-pic';

@Injectable({ providedIn: 'root' })
export class QrcodeRequestRepository {
  private api = inject(QrcodeRequestApiService);

  submit(body: SubmitQRCodeRequestBody): Observable<QRCodeRequest> { return this.api.submit(body); }
  pic(): Observable<QRCodePIC> { return this.api.pic(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<QRCodeRequest>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<QRCodeRequest> { return this.api.cmsGet(id); }
  approve(id: number): Observable<QRCodeRequest> { return this.api.approve(id); }
  reject(id: number, rejectionReason: string): Observable<unknown> { return this.api.reject(id, rejectionReason); }
}
