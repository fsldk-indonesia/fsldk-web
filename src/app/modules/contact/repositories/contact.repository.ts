import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ContactApiService } from '../services/contact-api.service';
import { ContactDetail, ContactListItem, ReplyContactPayload, SendContactPayload } from '../entities/contact';
import { Pagination } from '../../../core/entities/pagination';

/**
 * State and data repository for the Contact Us module. `submitting` signal
 * murni untuk form publik "Hubungi Kami" — sisi CMS memakai method yang
 * me-return Observable langsung, dikonsumsi lewat presenter
 * (ContactIndexPresenter), pola sama seperti Pengguna/Berita.
 */
@Injectable({ providedIn: 'root' })
export class ContactRepository {
  private api = inject(ContactApiService);

  submitting = signal<boolean>(false);

  sendPublic(payload: SendContactPayload): Observable<null> {
    this.submitting.set(true);
    return this.api.sendPublicMessage(payload).pipe(
      tap({
        next: () => this.submitting.set(false),
        error: () => this.submitting.set(false),
      })
    );
  }

  // CMS
  cmsList(q: Record<string, unknown>): Observable<Pagination<ContactListItem>> { return this.api.cmsList(q); }
  /** Detail lengkap (menandai pesan sudah dibaca otomatis di backend). */
  cmsGet(id: number): Observable<ContactDetail> { return this.api.getCMS(id); }
  markRead(id: number): Observable<null> { return this.api.markReadCMS(id); }
  remove(id: number): Observable<null> { return this.api.deleteCMS(id); }
  bulkDelete(ids: number[]): Observable<null> { return this.api.bulkDelete(ids); }
  reply(id: number, payload: ReplyContactPayload): Observable<null> { return this.api.replyCMS(id, payload); }
}
