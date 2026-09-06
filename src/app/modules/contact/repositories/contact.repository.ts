import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ContactApiService } from '../services/contact-api.service';
import {
  ContactDetail,
  ContactListItem,
  ContactListQuery,
  ReplyContactPayload,
  SendContactPayload,
} from '../entities/contact';
import { ApiResponse } from '../../../core/entities/api-response';

/**
 * State and data repository for the Contact Us module.
 */
@Injectable({ providedIn: 'root' })
export class ContactRepository {
  private api = inject(ContactApiService);

  // Signals for CMS list
  messages = signal<ContactListItem[]>([]);
  total = signal<number>(0);
  page = signal<number>(1);
  limit = signal<number>(15);

  // Selected message detail for preview modal
  selectedDetail = signal<ContactDetail | null>(null);

  // Loading & error states
  loading = signal<boolean>(false);
  detailLoading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  error = signal<string | null>(null);

  /**
   * Submit inquiry from public form.
   */
  sendPublic(payload: SendContactPayload): Observable<ApiResponse<null>> {
    this.submitting.set(true);
    return this.api.sendPublicMessage(payload).pipe(
      tap({
        next: () => this.submitting.set(false),
        error: () => this.submitting.set(false),
      })
    );
  }

  /**
   * Fetch CMS messages with filtering and pagination.
   */
  loadCMS(query: ContactListQuery = {}): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.listCMS(query).subscribe({
      next: (res) => {
        const result = res.result;
        this.messages.set(result.data || []);
        this.page.set(result.page);
        this.limit.set(result.limit);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat pesan kontak');
        this.loading.set(false);
      },
    });
  }

  /**
   * Load detail message by ID and update the read status locally.
   */
  loadDetail(id: number): Observable<ApiResponse<ContactDetail>> {
    this.detailLoading.set(true);
    return this.api.getCMS(id).pipe(
      tap({
        next: (res) => {
          this.selectedDetail.set(res.result);
          this.detailLoading.set(false);
          // Mark locally as read in the list
          this.messages.update((list) =>
            list.map((m) => (m.messageID === id ? { ...m, isRead: true } : m))
          );
        },
        error: () => this.detailLoading.set(false),
      })
    );
  }

  /**
   * Explicitly mark message as read.
   */
  markRead(id: number): Observable<ApiResponse<null>> {
    return this.api.markReadCMS(id).pipe(
      tap({
        next: () => {
          this.messages.update((list) =>
            list.map((m) => (m.messageID === id ? { ...m, isRead: true } : m))
          );
        },
      })
    );
  }

  /**
   * Delete message by ID.
   */
  deleteMessage(id: number): Observable<ApiResponse<null>> {
    return this.api.deleteCMS(id).pipe(
      tap({
        next: () => {
          this.messages.update((list) => list.filter((m) => m.messageID !== id));
          this.total.update((t) => Math.max(0, t - 1));
          if (this.selectedDetail()?.messageID === id) {
            this.selectedDetail.set(null);
          }
        },
      })
    );
  }

  /**
   * Reply to contact message via official email.
   */
  replyMessage(id: number, payload: ReplyContactPayload): Observable<ApiResponse<null>> {
    return this.api.replyCMS(id, payload).pipe(
      tap({
        next: () => {
          this.messages.update((list) =>
            list.map((m) => (m.messageID === id ? { ...m, isRead: true } : m))
          );
        },
      })
    );
  }
}
