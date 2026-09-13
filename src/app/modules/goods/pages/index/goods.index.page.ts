import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { Goods } from '../../entities/goods';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { GoodsIndexPresenter } from './goods.index.presenter';
import { GoodsIndexView } from './goods.index.view';

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Tersedia',
  out_of_stock: 'Stok Habis',
  coming_soon: 'Segera Hadir',
};

/** Config CmsIndexConfig<Goods> — lihat CmsIndexComponent untuk kontrak
 *  lengkapnya, pola sama seperti Berita. */
function buildGoodsIndexConfig(presenter: GoodsIndexPresenter): CmsIndexConfig<Goods> {
  return {
    entityLabel: 'produk',
    guideCards: [
      { icon: 'plus', title: 'Tambah Produk', description: 'Klik <strong>"+ Tambah Produk"</strong> untuk menambah katalog baru — isi nama, kategori, harga, hingga galeri gambar.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, cari nama/SKU, atau cari berdasarkan Kategori/Ketersediaan, atau atur rentang tanggal.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Detail & Status', description: 'Klik baris mana pun untuk melihat detail lengkap produk, atau ikon mata untuk mempublikasikan.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu produk lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
    ],
    searchTargets: [
      { value: 'name', label: 'Nama / SKU' },
      { value: 'category', label: 'Kategori', mode: 'combobox', loadOptions: () => presenter.categoryOptions() },
      { value: 'availability', label: 'Ketersediaan', mode: 'combobox', loadOptions: () => presenter.availabilityOptions() },
    ],
    showDateRange: true,
    columns: [
      { key: 'thumb', label: '', sortable: false },
      { key: 'goodsName', label: 'Produk', locked: true },
      { key: 'categoryName', label: 'Kategori', sortable: false },
      { key: 'price', label: 'Harga' },
      { key: 'availabilityStatus', label: 'Ketersediaan', sortable: false },
      { key: 'isPublished', label: 'Status', sortable: false },
      { key: 'createdDate', label: 'Dibuat' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'goodsID',
    emptyIcon: 'shopping-bag',
    emptyTitle: 'Belum ada produk',
    emptyDescription: 'Produk yang Anda tambahkan akan muncul di sini.',
    createRoute: '/cms/goods/products/form',
    createLabel: 'Tambah Produk',
  };
}

@Component({
  selector: 'app-goods-index-page',
  standalone: true,
  templateUrl: './goods.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [GoodsIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .thumb { width: 44px; height: 44px; border-radius: 6px; border: 1px solid var(--color-border); object-fit: cover; display: block; background: var(--color-bg-warm); }
  `],
})
export class GoodsIndexPage implements OnInit, GoodsIndexView {
  private presenter = inject(GoodsIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Goods>;

  busy = signal<ReadonlySet<number>>(new Set());
  readonly formatRupiah = formatRupiah;
  readonly availabilityLabels = AVAILABILITY_LABELS;

  canCreate = this.auth.hasPermission('goods.create');
  canUpdate = this.auth.hasPermission('goods.update');
  canPublish = this.auth.hasPermission('goods.publish');
  canDelete = this.auth.hasPermission('goods.delete');

  readonly config = buildGoodsIndexConfig(this.presenter);
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewGoods(g: Goods): void { this.router.navigate(['/cms/goods/products/view', g.goodsID]); }

  togglePublish(g: Goods): void { this.setBusy(g.goodsID); this.presenter.togglePublish(g); }
  toggleFeatured(g: Goods): void { this.setBusy(g.goodsID); this.presenter.toggleFeatured(g); }

  async remove(g: Goods, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus produk "${g.goodsName}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Produk', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(g.goodsID);
    this.presenter.remove(g);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onPublishToggleSuccess(): void { this.table.refresh(); }
  onFeaturedToggleSuccess(): void { this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
