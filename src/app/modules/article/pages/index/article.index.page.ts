import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Article } from '../../entities/article';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ArticleIndexPresenter } from './article.index.presenter';
import { ArticleIndexView } from './article.index.view';

/** Config CmsIndexConfig<Article> — pemakaian kedua CmsIndexComponent
 *  setelah Berita (lihat news.index.page.ts), dibuat lewat factory karena
 *  target "Kategori" butuh loadOptions yang menunjuk ke presenter instance. */
function buildArticleIndexConfig(presenter: ArticleIndexPresenter): CmsIndexConfig<Article> {
  return {
    entityLabel: 'artikel',
    guideCards: [
      { icon: 'plus', title: 'Tambah Artikel', description: 'Klik <strong>"+ Tambah Artikel"</strong> untuk membuat artikel baru — isi judul, pendahuluan, penulis, kategori, gambar, dan berkas PDF.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, pilih kolom yang ingin dicari (Judul/Penulis/Kategori), atau atur rentang tanggal — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Edit & Publish', description: 'Klik ikon pensil untuk mengedit, atau ikon mata untuk publish/tarik publikasi artikel.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu artikel lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: '', label: 'Semua Status' },
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
    ],
    searchTargets: [
      { value: 'title', label: 'Judul' },
      { value: 'writer', label: 'Penulis' },
      { value: 'category', label: 'Kategori', mode: 'combobox', loadOptions: () => presenter.categoryOptions() },
    ],
    showDateRange: true,
    columns: [
      { key: 'articleTitle', label: 'Judul', locked: true },
      { key: 'articleWriter', label: 'Penulis' },
      { key: 'categoryName', label: 'Kategori' },
      { key: 'isPublished', label: 'Status' },
      { key: 'createdDate', label: 'Tanggal' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'articleID',
    emptyIcon: 'file-text',
    emptyTitle: 'Belum ada artikel',
    emptyDescription: 'Artikel dan kajian yang Anda publikasikan akan muncul di sini.',
    createRoute: '/cms/articles/form',
    createLabel: 'Tambah Artikel',
  };
}

@Component({
  selector: 'app-article-index-page',
  standalone: true,
  templateUrl: './article.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [ArticleIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class ArticleIndexPage implements OnInit, ArticleIndexView {
  private presenter = inject(ArticleIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  // Dipakai host untuk memanggil refresh() setelah aksi row-level (publish/
  // hapus/hapus massal) berhasil — pola yang sama seperti onXxxSuccess->load() lama.
  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Article>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('article.create');
  canUpdate = this.auth.hasPermission('article.update');
  canPublish = this.auth.hasPermission('article.publish');
  canDelete = this.auth.hasPermission('article.delete');

  readonly config = buildArticleIndexConfig(this.presenter);
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewArticle(a: Article): void { this.router.navigate(['/cms/articles/view', a.articleID]); }

  togglePublish(a: Article): void { this.setBusy(a.articleID); this.presenter.togglePublish(a); }

  async remove(a: Article, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus artikel "${a.articleTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Artikel', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(a.articleID);
    this.presenter.remove(a);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onPublishToggleSuccess(): void { this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
