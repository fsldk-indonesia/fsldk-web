import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ShortlinkRequestApiService, SubmitShortLinkRequestBody } from '../services/shortlinkrequest-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { ShortLinkRequest } from '../entities/shortlink-request';
import { ShortLinkPIC } from '../entities/shortlink-pic';

@Injectable({ providedIn: 'root' })
export class ShortlinkRequestRepository {
  private api = inject(ShortlinkRequestApiService);

  submit(body: SubmitShortLinkRequestBody): Observable<ShortLinkRequest> { return this.api.submit(body); }
  pic(): Observable<ShortLinkPIC> { return this.api.pic(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<ShortLinkRequest>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<ShortLinkRequest> { return this.api.cmsGet(id); }
  approve(id: number): Observable<ShortLinkRequest> { return this.api.approve(id); }
  reject(id: number, rejectionReason: string): Observable<unknown> { return this.api.reject(id, rejectionReason); }
}
