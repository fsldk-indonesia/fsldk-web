import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ContactRepository } from '../../repositories/contact.repository';
import { ContactListItem, ReplyContactPayload } from '../../entities/contact';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ContactIndexView } from './contact.index.view';

@Injectable()
export class ContactIndexPresenter extends BasePresenter<ContactIndexView> {
  private contactRepo = inject(ContactRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param contact_dto.ContactListQuery. Status "Belum Dibaca"/"Sudah
   *  Dibaca" MUTUALLY EXCLUSIVE di backend (satu kolom boolean `isRead`,
   *  bukan array) — kalau kedua opsi dicentang sekaligus atau tidak ada yang
   *  dicentang, artinya "semua status", isRead dikirim kosong. Pencarian
   *  Nama/Email/Subjek SATU target gabungan (backend OR ketiganya lewat satu
   *  parameter `search`, lihat contact_repository_impl.go) — beda dari
   *  Berita yang punya kolom terpisah per field. */
  list(params: CmsListParams): Observable<Pagination<ContactListItem>> {
    const isRead = params.status.length === 1 ? (params.status[0] === 'read' ? 'true' : 'false') : '';
    return this.contactRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      isRead,
    });
  }

  loadDetail(id: number): void {
    this.contactRepo.cmsGet(id).subscribe({
      next: (detail) => this.view.setDetail(detail),
      error: (err) => this.toast.error(err.error?.message || 'Gagal memuat detail pesan'),
    });
  }

  sendReply(id: number, email: string, payload: ReplyContactPayload): void {
    this.view.setSending(true);
    this.contactRepo.reply(id, payload).subscribe({
      next: () => {
        this.toast.success(`Balasan resmi berhasil dikirim ke ${email}`);
        this.view.setSending(false);
        this.view.onReplySuccess();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal mengirimkan balasan email.');
        this.view.setSending(false);
      },
    });
  }

  remove(id: number): void {
    this.contactRepo.remove(id).subscribe({
      next: () => { this.toast.success('Pesan kontak dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.contactRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} pesan terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
