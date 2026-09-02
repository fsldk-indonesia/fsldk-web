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
        <div class="modal modal-pop" (click)="$event.stopPropagation()">
          <div class="modal-header flex justify-between items-center">
            <h3 class="modal-title">
              <app-icon name="mail" [size]="18" class="mr-xs text-primary" /> Detail Pesan Kontak
            </h3>
            <button type="button" class="btn-close-modal" (click)="closeDetailModal()">
              <app-icon name="x" [size]="16" />
            </button>
          </div>

          <div class="modal-body">
            <!-- Sender info grid -->
            <div class="detail-meta-grid mb-md">
              <div class="meta-field">
                <span class="meta-label">Nama Pengirim</span>
                <span class="meta-val font-semibold">{{ selectedMessage()!.senderName }}</span>
              </div>
              <div class="meta-field">
                <span class="meta-label">Alamat Email</span>
                <a [href]="'mailto:' + selectedMessage()!.email" class="meta-link">
                  {{ selectedMessage()!.email }}
                </a>
              </div>
              <div class="meta-field">
                <span class="meta-label">Waktu Diterima</span>
                <span class="meta-val">{{ selectedMessage()!.createdDate | date: 'd MMMM y, HH:mm:ss' }}</span>
              </div>
              <div class="meta-field">
                <span class="meta-label">Alamat IP Pengirim</span>
                <span class="meta-val font-mono">{{ selectedMessage()!.ipAddress || '–' }}</span>
              </div>
            </div>

            <!-- Subject -->
            <div class="detail-subject-box mb-md">
              <span class="meta-label">Subjek</span>
              <div class="subject-content">{{ selectedMessage()!.subject }}</div>
            </div>

            <!-- Message Body -->
            <div class="detail-message-box">
              <span class="meta-label">Isi Pesan</span>
              <div class="message-content">{{ selectedMessage()!.message }}</div>
            </div>
          </div>

          <div class="modal-footer flex justify-between items-center">
            <a
              [href]="'mailto:' + selectedMessage()!.email + '?subject=' + replySubject(selectedMessage()!.subject)"
              class="btn btn-outline"
              target="_blank"
            >
              <app-icon name="send" [size]="14" class="mr-xs" /> Balas via Email
            </a>
            <button type="button" class="btn btn-primary" (click)="closeDetailModal()">
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
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal {
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 28px;
      width: 100%;
      max-width: 640px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-xl);
    }
    .modal-confirm { max-width: 460px; }
    
    .modal-header {
      flex-shrink: 0;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--color-border);
    }
    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
    }
    .btn-close-modal {
      border: none;
      background: transparent;
      color: var(--color-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-xs);
    }
    .btn-close-modal:hover { color: var(--color-text); }

    .modal-body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 20px 0;
    }

    .modal-footer {
      flex-shrink: 0;
      padding-top: 18px;
      border-top: 1px solid var(--color-border);
    }

    /* Detail Modal Specifics */
    .detail-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: var(--color-bg-alt);
      padding: 16px;
      border-radius: var(--radius-md);
    }
    .meta-field { display: flex; flex-direction: column; gap: 3px; }
    .meta-label { font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-muted); }
    .meta-val { font-size: 0.9rem; color: var(--color-text); }
    .meta-link { font-size: 0.9rem; color: var(--color-primary); font-weight: 600; text-decoration: none; }
    .meta-link:hover { text-decoration: underline; }
    .font-mono { font-family: monospace; font-size: 0.85rem; }

    .detail-subject-box {
      padding: 14px 16px;
      border-left: 3px solid var(--color-primary);
      background: var(--color-primary-soft);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    .subject-content { font-size: 1.05rem; font-weight: 700; color: var(--color-primary-dark); margin-top: 3px; }

    .detail-message-box {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 18px;
      background: #fafafa;
    }
    .message-content {
      margin-top: 8px;
      font-size: 0.95rem;
      line-height: 1.65;
      color: var(--color-text);
      white-space: pre-wrap;
      word-break: break-word;
    }
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
