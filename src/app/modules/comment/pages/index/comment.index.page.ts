import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { of } from 'rxjs';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Comment } from '../../entities/comment';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { CONTENT_TYPE_OPTIONS } from '../../comment.constants';
import { CommentIndexPresenter } from './comment.index.presenter';
import { CommentIndexView } from './comment.index.view';

/** Config CmsIndexConfig<Comment> — antrean moderasi, bukan CRUD biasa (mirip
 *  Permintaan Shortlink): TANPA createRoute/createLabel karena komentar
 *  datang dari pengguna, bukan dibuat lewat CMS. Tipe Konten memakai mode
 *  combobox (bukan text) karena nilainya himpunan tetap (lihat
 *  CONTENT_TYPE_OPTIONS) — sama pola seperti kolom Kategori di Berita. */
function buildCommentIndexConfig(): CmsIndexConfig<Comment> {
  const contentTypeOptions = CONTENT_TYPE_OPTIONS
    .filter((o) => o.value !== '')
    .map((o) => ({ id: o.value, label: o.label }));

  return {
    entityLabel: 'komentar',
    guideCards: [
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari isi komentar atau nama penulis secara terpisah, pilih Tipe Konten, atau atur rentang tanggal — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'globe', title: 'Lintas Konten', description: 'Komentar dari Artikel, Berita, Event, dan konten lain yang mendukung komentar semuanya masuk ke satu pusat moderasi ini.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat detail lengkap komentar — penulis, konten yang dikomentari, dan reaksinya.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu komentar lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus sekaligus.' },
    ],
    searchTargets: [
      { value: 'search', label: 'Komentar' },
      { value: 'author', label: 'Penulis' },
      { value: 'contentType', label: 'Tipe Konten', mode: 'combobox', loadOptions: () => of(contentTypeOptions) },
    ],
    showDateRange: true,
    columns: [
      { key: 'commentText', label: 'Komentar', locked: true, sortable: false },
      { key: 'authorName', label: 'Penulis', sortable: false },
      { key: 'contentType', label: 'Tipe Konten' },
      { key: 'createdDate', label: 'Tanggal' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'commentID',
    emptyIcon: 'comments',
    emptyTitle: 'Belum ada komentar',
    emptyDescription: 'Komentar dari pengunjung akan muncul di sini.',
  };
}

@Component({
  selector: 'app-comment-index-page',
  standalone: true,
  templateUrl: './comment.index.page.html',
  imports: [DatePipe, SlicePipe, IconComponent, CmsIndexComponent],
  providers: [CommentIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class CommentIndexPage implements OnInit, CommentIndexView {
  private presenter = inject(CommentIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Comment>;

  busy = signal<ReadonlySet<number>>(new Set());

  canDelete = this.auth.hasPermission('comment.delete');

  readonly config = buildCommentIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewComment(c: Comment): void { this.router.navigate(['/cms/comments', c.commentID]); }

  async remove(c: Comment, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus komentar dari "${c.author.name}"? Balasan & reaksi ikut terhapus.`, {
      title: 'Hapus Komentar', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(c.commentID);
    this.presenter.remove(c.commentID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
