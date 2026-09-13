import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { GoodsCategory } from '../../entities/goods-category';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { GoodsCategoryIndexPresenter } from './goods-category.index.presenter';
import { GoodsCategoryIndexView } from './goods-category.index.view';

/** Config CmsIndexConfig<GoodsCategory> — lihat CmsIndexComponent untuk
 *  kontrak lengkapnya, pola sama seperti Berita. */
function buildGoodsCategoryIndexConfig(): CmsIndexConfig<GoodsCategory> {
  return {
    entityLabel: 'kategori',
    guideCards: [
      { icon: 'plus', title: 'Tambah Kategori', description: 'Klik <strong>"+ Tambah Kategori"</strong> untuk membuat kategori produk baru — isi nama dan urutan tampilnya.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, atau cari berdasarkan Nama Kategori.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Detail & Status', description: 'Klik baris mana pun untuk melihat detail kategori, atau ikon mata untuk mengaktifkan/menonaktifkan.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu kategori lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    searchTargets: [
      { value: 'search', label: 'Nama Kategori' },
    ],
    columns: [
      { key: 'categoryName', label: 'Nama Kategori', locked: true },
      { key: 'categorySlug', label: 'Slug', sortable: false },
      { key: 'sortOrder', label: 'Urutan' },
      { key: 'isActive', label: 'Status', sortable: false },
      { key: 'createdDate', label: 'Dibuat' },
    ],
    defaultSort: { sortBy: 'sortOrder', sortDir: 'asc' },
    rowIdKey: 'goodsCategoryID',
    emptyIcon: 'tags',
    emptyTitle: 'Belum ada kategori',
    emptyDescription: 'Kategori produk yang Anda tambahkan akan muncul di sini.',
    createRoute: '/cms/goods/categories/form',
    createLabel: 'Tambah Kategori',
  };
}

@Component({
  selector: 'app-goods-category-index-page',
  standalone: true,
  templateUrl: './goods-category.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [GoodsCategoryIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class GoodsCategoryIndexPage implements OnInit, GoodsCategoryIndexView {
  private presenter = inject(GoodsCategoryIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<GoodsCategory>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('goodscategory.create');
  canUpdate = this.auth.hasPermission('goodscategory.update');
  canDelete = this.auth.hasPermission('goodscategory.delete');

  readonly config = buildGoodsCategoryIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewCategory(cat: GoodsCategory): void { this.router.navigate(['/cms/goods/categories/view', cat.goodsCategoryID]); }

  toggleActive(cat: GoodsCategory): void { this.setBusy(cat.goodsCategoryID); this.presenter.toggleActive(cat); }

  async remove(cat: GoodsCategory, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus kategori "${cat.categoryName}"? Kategori yang masih dipakai produk tidak dapat dihapus.`, {
      title: 'Hapus Kategori', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(cat.goodsCategoryID);
    this.presenter.remove(cat);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onToggleSuccess(): void { this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
