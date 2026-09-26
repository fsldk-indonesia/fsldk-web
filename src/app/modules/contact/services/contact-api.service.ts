import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import {
  ContactDetail,
  ContactListItem,
  ReplyContactPayload,
  SendContactPayload,
} from '../entities/contact';

/** Raw HTTP calls for the Contact Us module — public & CMS. */
@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private api = inject(ApiService);

  sendPublicMessage(payload: SendContactPayload): Observable<null> {
    return this.api.post('/public/contact', payload);
  }

  cmsList(q: Record<string, unknown>): Observable<Pagination<ContactListItem>> {
    return this.api.get('/contact-messages', q);
  }

  getCMS(id: number): Observable<ContactDetail> {
    return this.api.get(`/contact-messages/${id}`);
  }

  markReadCMS(id: number): Observable<null> {
    return this.api.patch(`/contact-messages/${id}/read`);
  }

  deleteCMS(id: number): Observable<null> {
    return this.api.delete(`/contact-messages/${id}`);
  }

  bulkDelete(ids: number[]): Observable<null> {
    return this.api.post('/contact-messages/bulk-delete', { ids });
  }

  replyCMS(id: number, payload: ReplyContactPayload): Observable<null> {
    return this.api.post(`/contact-messages/${id}/reply`, payload);
  }
}
