import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { FinanceFormat } from '../../entities/finance-format';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { FinanceFormatIndexPresenter } from './financeformat.index.presenter';
import { FinanceFormatIndexView } from './financeformat.index.view';

/** Config CmsIndexConfig<FinanceFormat> — lihat CmsIndexComponent untuk
 *  kontrak lengkapnya, pola sama seperti Berita. Kategori memakai mode
 *  combobox (loadOptions dinamis) — sama seperti kolom Kategori di
 *  Perpustakaan. */
function buildFinanceFormatIndexConfig(presenter: FinanceFormatIndexPresenter): CmsIndexConfig<FinanceFormat> {
  return {
    entityLabel: 'format keuangan',
    guideCards: [
      { icon: 'plus', title: 'Tambah Format', description: 'Klik <strong>"+ Tambah Format"</strong> untuk mengunggah template Excel baru — isi nama file dan pilih kategorinya.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, pilih kolom yang ingin dicari (Nama File), atau cari berdasarkan Kategori, atau atur rentang tanggal unggah.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Detail & Status', description: 'Klik baris mana pun untuk melihat detail lengkap format, atau ikon mata untuk mengaktifkan/menonaktifkan.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu format lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    searchTargets: [
      { value: 'fileName', label: 'Nama File' },
      { value: 'category', label: 'Kategori', mode: 'combobox', loadOptions: () => presenter.categoryOptions() },
    ],
    showDateRange: true,
    columns: [
      { key: 'fileName', label: 'Nama File', locked: true },
      { key: 'formatTypeName', label: 'Kategori', sortable: false },
      { key: 'isActive', label: 'Status', sortable: false },
      { key: 'createdDate', label: 'Tanggal Unggah' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'financeFormatID',
    emptyIcon: 'file-spreadsheet',
    emptyTitle: 'Belum ada format',
    emptyDescription: 'Template yang Anda unggah akan muncul di sini.',
    createRoute: '/cms/finance-formats/form',
    createLabel: 'Tambah Format',
  };
}

@Component({
  selector: 'app-financeformat-index-page',
  standalone: true,
  templateUrl: './financeformat.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [FinanceFormatIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class FinanceFormatIndexPage implements OnInit, FinanceFormatIndexView {
  private presenter = inject(FinanceFormatIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<FinanceFormat>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('financeformat.create');
  canUpdate = this.auth.hasPermission('financeformat.update');
  canPublish = this.auth.hasPermission('financeformat.publish');
  canDelete = this.auth.hasPermission('financeformat.delete');

  readonly config = buildFinanceFormatIndexConfig(this.presenter);
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewFormat(f: FinanceFormat): void { this.router.navigate(['/cms/finance-formats/view', f.financeFormatID]); }

  togglePublish(f: FinanceFormat): void { this.setBusy(f.financeFormatID); this.presenter.togglePublish(f); }

  async remove(f: FinanceFormat, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus format "${f.fileName}"? Berkas ikut terhapus dari server dan tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Format Keuangan', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(f.financeFormatID);
    this.presenter.remove(f);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onPublishToggleSuccess(): void { this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
