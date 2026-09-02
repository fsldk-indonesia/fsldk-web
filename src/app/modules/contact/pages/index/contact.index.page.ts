import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ContactRepository } from '../../repositories/contact.repository';
import { ContactDetail, ContactListItem } from '../../entities/contact';
import { ToastService } from '../../../../core/services/toast.service';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';

/**
 * CMS Contact Messages Inbox page.
 * Displays paginated inquiries with search, read/unread status filtering, full detail modal, and delete action.
 */
@Component({
  selector: 'app-contact-index',
  standalone: true,
  imports: [FormsModule, DatePipe, IconComponent, PaginationComponent],
  template: `
    <div class="page-header flex justify-between items-center mb-lg">
      <div>
        <h1 class="page-title">Pesan Kontak</h1>
        <p class="text-muted text-sm">Kelola pesan dan pertanyaan masuk yang dikirim pengunjung melalui form Hubungi Kami.</p>
      </div>
    </div>

    <!-- Filters and Search Toolbar -->
    <div class="card mb-md toolbar-card">
      <div class="toolbar-grid">
        <div class="search-wrap">
          <app-icon name="search" [size]="16" class="search-icon" />
          <input
            type="text"
            class="form-control search-input"
            placeholder="Cari nama pengirim, email, atau subjek..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
          />
          @if (searchQuery()) {
            <button type="button" class="btn-clear-search" (click)="clearSearch()">
              <app-icon name="x" [size]="14" />
            </button>
          }
        </div>

        <div class="filter-controls">
          <select
            class="form-control status-select"
            [ngModel]="statusFilter()"
            (ngModelChange)="onStatusChange($event)"
          >
            <option value="">Semua Status</option>
            <option value="false">Belum Dibaca</option>
            <option value="true">Sudah Dibaca</option>
          </select>

          @if (hasActiveFilter()) {
            <button type="button" class="btn btn-outline btn-sm" (click)="resetFilters()">
              <app-icon name="rotate-ccw" [size]="13" /> Reset Filter
            </button>
          }
        </div>
      </div>
    </div>

    <!-- Messages Table Card -->
    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 50px">ID</th>
              <th style="width: 220px">Pengirim</th>
              <th>Subjek</th>
              <th style="width: 160px">Waktu Kirim</th>
              <th style="width: 130px">Status</th>
              <th style="text-align: right; width: 110px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @if (repo.loading()) {
              <tr>
                <td colspan="6" class="text-center py-xl text-muted">
                  <div class="spinner"></div> Memuat pesan kontak...
                </td>
              </tr>
            } @else if (repo.error()) {
              <tr>
                <td colspan="6" class="text-center py-xl text-danger">
                  <app-icon name="alert-triangle" [size]="24" class="mb-sm" />
                  <div>{{ repo.error() }}</div>
                  <button class="btn btn-sm btn-outline mt-sm" (click)="loadData()">Coba Lagi</button>
                </td>
              </tr>
            } @else if (repo.messages().length === 0) {
              <tr>
                <td colspan="6" class="text-center py-xl text-muted">
                  <app-icon name="inbox" [size]="36" class="mb-sm" />
                  <div>Tidak ada pesan kontak yang ditemukan.</div>
                </td>
              </tr>
            } @else {
              @for (item of repo.messages(); track item.messageID) {
                <tr [class.unread-row]="!item.isRead">
                  <td class="text-muted">#{{ item.messageID }}</td>
                  <td>
                    <div class="sender-name" [class.font-bold]="!item.isRead">{{ item.senderName }}</div>
                    <div class="sender-email text-muted text-xs">{{ item.email }}</div>
                  </td>
                  <td>
                    <div class="subject-text" [class.font-bold]="!item.isRead">{{ item.subject }}</div>
                  </td>
                  <td class="text-muted text-sm">
                    {{ item.createdDate | date: 'd MMM y, HH:mm' }}
                  </td>
                  <td>
                    @if (!item.isRead) {
                      <span class="chip chip-green">
                        <app-icon name="mail" [size]="12" /> Baru
                      </span>
                    } @else {
                      <span class="chip chip-gray">
                        <app-icon name="check" [size]="12" /> Dibaca
                      </span>
                    }
                  </td>
                  <td style="text-align: right">
                    <div class="table-actions" style="justify-content: flex-end">
                      <button
                        type="button"
                        class="icon-action"
                        title="Lihat Detail Pesan"
                        (click)="openDetail(item.messageID)"
                      >
                        <app-icon name="eye" [size]="14" />
                      </button>
                      <button
                        type="button"
                        class="icon-action danger"
                        title="Hapus Pesan"
                        (click)="confirmDelete(item)"
                      >
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (repo.total() > repo.limit()) {
        <div class="pagination-container">
          <app-pagination
            [page]="repo.page()"
            [count]="repo.total()"
            [limit]="repo.limit()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }
    </div>

    <!-- Detail Message Modal -->
    @if (detailModalOpen() && selectedMessage()) {
      <div class="modal-backdrop" (click)="closeDetailModal()">
        <div class="modal modal-pop modal-detail" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-top-row">
              <div class="flex items-center gap-xs">
                <span class="chip chip-green">
                  <app-icon name="envelope" [size]="12" /> Pesan Masuk
                </span>
                <span class="modal-id-badge">#{{ selectedMessage()!.messageID }}</span>
              </div>
              <button type="button" class="btn-close-modal" (click)="closeDetailModal()" title="Tutup">
                <app-icon name="x" [size]="16" />
              </button>
            </div>
            <h2 class="modal-subject-title">{{ selectedMessage()!.subject }}</h2>
          </div>

          <div class="modal-body">
            <!-- Sender Profile Bar -->
            <div class="sender-profile-card">
              <div class="sender-avatar">
                {{ getInitials(selectedMessage()!.senderName) }}
              </div>
              <div class="sender-info">
                <div class="sender-name">{{ selectedMessage()!.senderName }}</div>
                <a [href]="'mailto:' + selectedMessage()!.email" class="sender-email">
                  <app-icon name="envelope" [size]="12" class="mr-xs" />{{ selectedMessage()!.email }}
                </a>
              </div>
              <div class="message-meta-right">
                <div class="meta-date">
                  <app-icon name="calendar-days" [size]="12" class="mr-xs" />
                  {{ selectedMessage()!.createdDate | date: 'd MMMM y, HH:mm' }}
                </div>
                <div class="meta-ip">
                  <app-icon name="globe" [size]="12" class="mr-xs" />
                  IP: {{ selectedMessage()!.ipAddress || '–' }}
                </div>
              </div>
            </div>

            <!-- Message Body Area -->
            <div class="message-body-container">
              <div class="message-body-label">
                <app-icon name="messages" [size]="13" class="mr-xs text-primary" /> Isi Pesan
              </div>
              <div class="message-body-text">{{ selectedMessage()!.message }}</div>
            </div>
          </div>

          <div class="modal-footer flex justify-between items-center">
            <a
              [href]="'mailto:' + selectedMessage()!.email + '?subject=' + replySubject(selectedMessage()!.subject)"
              class="btn btn-primary"
              target="_blank"
            >
              <app-icon name="send" [size]="14" class="mr-xs" /> Balas via Email
            </a>
            <button type="button" class="btn btn-outline" (click)="closeDetailModal()">
              Tutup
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteModalOpen() && itemToDelete()) {
      <div class="modal-backdrop" (click)="cancelDelete()">
        <div class="modal modal-pop modal-confirm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title text-danger">
              <app-icon name="alert-triangle" [size]="18" class="mr-xs" /> Hapus Pesan Kontak
            </h3>
          </div>
          <div class="modal-body">
            <p>
              Apakah Anda yakin ingin menghapus pesan dari <strong>{{ itemToDelete()!.senderName }}</strong>
              dengan subjek <em>"{{ itemToDelete()!.subject }}"</em>?
            </p>
            <p class="text-danger text-sm mt-xs">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
          </div>
          <div class="modal-footer flex justify-end gap-sm">
            <button type="button" class="btn btn-outline" (click)="cancelDelete()" [disabled]="deleting()">
              Batal
            </button>
            <button type="button" class="btn btn-danger" (click)="executeDelete()" [disabled]="deleting()">
              @if (deleting()) {
                <div class="spinner spinner-sm mr-xs"></div> Menghapus...
              } @else {
                <app-icon name="trash" [size]="14" class="mr-xs" /> Ya, Hapus Pesan
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 800; color: var(--color-text); margin: 0 0 4px; }
    
    .toolbar-card { padding: 14px 18px; }
    .toolbar-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-wrap {
      position: relative;
      flex: 1 1 320px;
      max-width: 440px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-muted);
      pointer-events: none;
    }
    .search-input {
      padding-left: 36px;
      padding-right: 32px;
      height: 38px;
    }
    .btn-clear-search {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      border: none;
      background: none;
      cursor: pointer;
      color: var(--color-muted);
      display: flex;
      align-items: center;
      padding: 2px;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-select {
      width: 170px;
      height: 38px;
      padding: 6px 12px;
      font-size: 0.9rem;
    }

    /* Unread row highlight */
    .unread-row {
      background-color: #f7fdf9;
    }
    .unread-row:hover {
      background-color: #edfbf2 !important;
    }
    .font-bold { font-weight: 700; color: var(--color-text); }
    .sender-name { font-size: 0.92rem; }
    .sender-email { margin-top: 2px; }
    .subject-text { font-size: 0.92rem; color: var(--color-text); }

    /* Chips */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: var(--radius-full);
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .chip-green {
      background: #dcfce7;
      color: #15803d;
    }
    .chip-gray {
      background: var(--color-bg-alt);
      color: var(--color-text-secondary);
    }

    /* Circular action buttons */
    .table-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon-action {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      background: #fff;
      color: var(--color-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--motion-fast) ease;
      padding: 0;
    }
    .icon-action:hover {
      background: var(--color-primary-soft);
      border-color: var(--color-primary);
      color: var(--color-primary-dark);
      transform: translateY(-1px);
    }
    .icon-action.danger:hover {
      background: #fef2f2;
      border-color: #ef4444;
      color: #b91c1c;
    }

    .pagination-container {
      padding: 16px;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: center;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal {
      background: #fff;
      border-radius: var(--radius-lg);
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.16);
      overflow: hidden;
    }
    .modal-detail {
      max-width: 680px;
    }
    .modal-confirm {
      max-width: 440px;
      padding: 24px;
    }
    
    .modal-header {
      flex-shrink: 0;
      padding: 22px 28px 16px;
      border-bottom: 1px solid var(--color-border);
      background: #fff;
    }
    .modal-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .modal-id-badge {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-muted);
      background: var(--color-bg-alt);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }
    .modal-subject-title {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--color-text);
      line-height: 1.35;
      letter-spacing: -0.01em;
    }

    .btn-close-modal {
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-border);
      background: #fff;
      color: var(--color-muted);
      cursor: pointer;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--motion-fast);
    }
    .btn-close-modal:hover {
      background: var(--color-bg-alt);
      color: var(--color-text);
    }

    .modal-body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 22px 28px;
      background: #fff;
    }

    .sender-profile-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      margin-bottom: 20px;
    }
    .sender-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }
    .sender-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .sender-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text);
    }
    .sender-email {
      font-size: 0.88rem;
      color: var(--color-primary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      font-weight: 500;
    }
    .sender-email:hover { text-decoration: underline; }

    .message-meta-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
      font-size: 0.8rem;
      color: var(--color-muted);
      flex-shrink: 0;
    }
    .meta-date { display: inline-flex; align-items: center; font-weight: 500; }
    .meta-ip {
      display: inline-flex;
      align-items: center;
      background: #fff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-family: monospace;
      font-size: 0.78rem;
    }

    .message-body-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 20px 22px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    .message-body-label {
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-muted);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    .message-body-text {
      font-size: 0.95rem;
      line-height: 1.75;
      color: #334155;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .modal-footer {
      flex-shrink: 0;
      padding: 16px 28px;
      border-top: 1px solid var(--color-border);
      background: #f8fafc;
    }

    .modal-confirm .modal-header { padding: 0 0 14px; border-bottom: 1px solid var(--color-border); background: transparent; }
    .modal-confirm .modal-body { padding: 16px 0; background: transparent; }
    .modal-confirm .modal-footer { padding: 14px 0 0; background: transparent; border-top: 1px solid var(--color-border); }
  `],
})
export class ContactIndexPage implements OnInit {
  repo = inject(ContactRepository);
  private toast = inject(ToastService);
  private title = inject(Title);

  searchQuery = signal<string>('');
  statusFilter = signal<string>('');
  private searchTimeout: any;

  // Modals state
  detailModalOpen = signal<boolean>(false);
  selectedMessage = signal<ContactDetail | null>(null);

  deleteModalOpen = signal<boolean>(false);
  itemToDelete = signal<ContactListItem | null>(null);
  deleting = signal<boolean>(false);

  ngOnInit(): void {
    this.title.setTitle('Pesan Kontak — CMS FSLDK Indonesia');
    this.loadData();
  }

  loadData(): void {
    const isReadParam =
      this.statusFilter() === 'true'
        ? true
        : this.statusFilter() === 'false'
        ? false
        : undefined;

    this.repo.loadCMS({
      page: this.repo.page(),
      limit: this.repo.limit(),
      search: this.searchQuery().trim() || undefined,
      isRead: isReadParam,
      sort_by: 'createdDate',
      sort_order: 'desc',
    });
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.repo.page.set(1);
      this.loadData();
    }, 350);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.repo.page.set(1);
    this.loadData();
  }

  onStatusChange(val: string): void {
    this.statusFilter.set(val);
    this.repo.page.set(1);
    this.loadData();
  }

  hasActiveFilter(): boolean {
    return !!this.searchQuery().trim() || !!this.statusFilter();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.repo.page.set(1);
    this.loadData();
  }

  onPageChange(newPage: number): void {
    this.repo.page.set(newPage);
    this.loadData();
  }

  openDetail(id: number): void {
    this.repo.loadDetail(id).subscribe({
      next: (res) => {
        this.selectedMessage.set(res.result);
        this.detailModalOpen.set(true);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal memuat detail pesan.');
      },
    });
  }

  closeDetailModal(): void {
    this.detailModalOpen.set(false);
    this.selectedMessage.set(null);
  }

  replySubject(subject: string): string {
    return encodeURIComponent('Re: ' + subject);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  confirmDelete(item: ContactListItem): void {
    this.itemToDelete.set(item);
    this.deleteModalOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  executeDelete(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.deleting.set(true);
    this.repo.deleteMessage(item.messageID).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteModalOpen.set(false);
        this.itemToDelete.set(null);
        this.toast.success('Pesan berhasil dihapus.');
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(err.error?.message || 'Gagal menghapus pesan.');
      },
    });
  }
}
