import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DonationApiService } from '../services/donation-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { AdminCreateDonationRequest, AdminUpdateDonationRequest, CreateDonationRequest, Donation, DonationAdminDetail, DonationStatusResponse, PublicDonationItem } from '../entities/donation';

@Injectable({ providedIn: 'root' })
export class DonationRepository {
  private api = inject(DonationApiService);

  create(slug: string, body: CreateDonationRequest): Observable<Donation> { return this.api.create(slug, body); }
  recentDonations(slug: string, limit?: number): Observable<PublicDonationItem[]> { return this.api.recentDonations(slug, limit); }
  detail(publicRef: string): Observable<Donation> { return this.api.detail(publicRef); }
  status(publicRef: string): Observable<DonationStatusResponse> { return this.api.status(publicRef); }
  downloadReceipt(publicRef: string): Observable<{ blob: Blob; filename: string }> {
    return this.api.downloadReceipt(publicRef).pipe(tap((r) => this.triggerDownload(r)));
  }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Donation>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<DonationAdminDetail> { return this.api.cmsGet(id); }
  adminCreate(body: AdminCreateDonationRequest): Observable<Donation> { return this.api.adminCreate(body); }
  adminUpdate(id: number, body: AdminUpdateDonationRequest): Observable<Donation> { return this.api.adminUpdate(id, body); }
  adminDelete(id: number): Observable<void> { return this.api.adminDelete(id); }

  private triggerDownload(result: { blob: Blob; filename: string }): void {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
