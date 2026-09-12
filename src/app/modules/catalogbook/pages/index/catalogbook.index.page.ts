import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { CatalogBook } from '../../entities/catalog-book';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { CatalogBookIndexPresenter } from './catalogbook.index.presenter';
import { CatalogBookIndexView } from './catalogbook.index.view';

/** Config CmsIndexConfig<CatalogBook> — lihat CmsIndexComponent untuk
 *  kontrak lengkapnya, pola sama seperti Berita. Kategori memakai mode
 *  combobox (loadOptions dinamis) — sama seperti kolom Kategori di Berita. */
function buildCatalogBookIndexConfig(presenter: CatalogBookIndexPresenter): CmsIndexConfig<CatalogBook> {
  return {
    entityLabel: 'buku',
    guideCards: [
      { icon: 'plus', title: 'Tambah Buku', description: 'Klik <strong>"+ Tambah Buku"</strong> untuk menambah koleksi baru — isi judul, penulis, kategori, hingga berkas PDF-nya.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, pilih kolom yang ingin dicari (Judul/Penulis/Penerbit), atau cari berdasarkan Kategori.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Detail & Status', description: 'Klik baris mana pun untuk melihat detail lengkap buku, atau ikon mata untuk mengaktifkan/menonaktifkan.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu buku lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    searchTargets: [
      { value: 'title', label: 'Judul' },
      { value: 'author', label: 'Penulis' },
      { value: 'publisher', label: 'Penerbit' },
      { value: 'category', label: 'Kategori', mode: 'combobox', loadOptions: () => presenter.categoryOptions() },
    ],
    showDateRange: true,
    columns: [
      { key: 'bookTitle', label: 'Judul', locked: true },
      { key: 'authorName', label: 'Penulis' },
      { key: 'bookCategoryName', label: 'Kategori', sortable: false },
      { key: 'favoriteCount', label: 'Suka' },
      { key: 'isActive', label: 'Status' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'bookID',
    emptyIcon: 'book-open',
    emptyTitle: 'Belum ada buku',
    emptyDescription: 'Buku yang Anda tambahkan akan muncul di sini.',
    createRoute: '/cms/catalog-books/form',
    createLabel: 'Tambah Buku',
  };
}

@Component({
  selector: 'app-catalogbook-index-page',
  standalone: true,
  templateUrl: './catalogbook.index.page.html',
  imports: [RouterLink, IconComponent, CmsIndexComponent],
  providers: [CatalogBookIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class CatalogBookIndexPage implements OnInit, CatalogBookIndexView {
  private presenter = inject(CatalogBookIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<CatalogBook>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('catalogbook.create');
  canUpdate = this.auth.hasPermission('catalogbook.update');
  canPublish = this.auth.hasPermission('catalogbook.publish');
  canDelete = this.auth.hasPermission('catalogbook.delete');

  readonly config = buildCatalogBookIndexConfig(this.presenter);
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewBook(b: CatalogBook): void { this.router.navigate(['/cms/catalog-books/view', b.bookID]); }

  togglePublish(b: CatalogBook): void { this.setBusy(b.bookID); this.presenter.togglePublish(b); }

  async remove(b: CatalogBook, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus buku "${b.bookTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Buku', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(b.bookID);
    this.presenter.remove(b);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onPublishToggleSuccess(_wasActive: boolean): void { this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
