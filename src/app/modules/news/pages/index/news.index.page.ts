import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { News } from '../../entities/news';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { NewsIndexPresenter } from './news.index.presenter';
import { NewsIndexView } from './news.index.view';

/** Config CmsIndexConfig<News> — lihat CmsIndexComponent untuk kontrak
 *  lengkapnya. Ini contoh pemakaian pertama komponen index CMS generik;
 *  modul lain (Event, Artikel, dst.) tinggal bikin config serupa. Dibuat
 *  lewat factory (bukan konstanta statis) karena target "Kategori" butuh
 *  `loadOptions` yang menunjuk ke presenter instance milik komponen. */
function buildNewsIndexConfig(presenter: NewsIndexPresenter): CmsIndexConfig<News> {
  return {
    entityLabel: 'berita',
    guideCards: [
      { icon: 'plus', title: 'Tambah Berita', description: 'Klik <strong>"+ Tambah Berita"</strong> untuk membuat berita baru — isi judul, konten, reporter, kategori, dan gambar utama.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, pilih kolom yang ingin dicari (Judul/Reporter/Kategori), atau atur rentang tanggal — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Edit & Publish', description: 'Klik ikon pensil untuk mengedit, atau ikon mata untuk publish/tarik publikasi berita.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu berita lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    // Tanpa opsi sentinel "Semua Status" — MultiSelectComponent menampilkan
    // placeholder itu otomatis saat tidak ada yang dicentang.
    statusOptions: [
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
    ],
    searchTargets: [
      { value: 'title', label: 'Judul' },
      { value: 'reporter', label: 'Reporter' },
      { value: 'category', label: 'Kategori', mode: 'combobox', loadOptions: () => presenter.categoryOptions() },
    ],
    showDateRange: true,
    columns: [
      { key: 'newsTitle', label: 'Judul', locked: true },
      { key: 'newsReporter', label: 'Reporter' },
      { key: 'categoryName', label: 'Kategori' },
      { key: 'isPublished', label: 'Status' },
      { key: 'createdDate', label: 'Tanggal' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'newsID',
    emptyIcon: 'newspaper',
    emptyTitle: 'Belum ada berita',
    emptyDescription: 'Berita yang Anda publikasikan akan muncul di sini.',
    createRoute: '/cms/news/form',
    createLabel: 'Tambah Berita',
  };
}

@Component({
  selector: 'app-news-index-page',
  standalone: true,
  templateUrl: './news.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [NewsIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class NewsIndexPage implements OnInit, NewsIndexView {
  private presenter = inject(NewsIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  // Dipakai host untuk memanggil refresh() setelah aksi row-level (publish/
  // hapus/hapus massal) berhasil — pola yang sama seperti onXxxSuccess->load() lama.
  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<News>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('news.create');
  canUpdate = this.auth.hasPermission('news.update');
  canPublish = this.auth.hasPermission('news.publish');
  canDelete = this.auth.hasPermission('news.delete');

  readonly config = buildNewsIndexConfig(this.presenter);
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewNews(n: News): void { this.router.navigate(['/cms/news/view', n.newsID]); }

  togglePublish(n: News): void { this.setBusy(n.newsID); this.presenter.togglePublish(n); }

  async remove(n: News, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus berita "${n.newsTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Berita', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(n.newsID);
    this.presenter.remove(n);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onPublishToggleSuccess(_wasPublished: boolean): void { this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
