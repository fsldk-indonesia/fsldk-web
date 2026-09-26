import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { GalleryListItem } from '../../entities/gallery';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { GalleryIndexPresenter } from './gallery.index.presenter';
import { GalleryIndexView } from './gallery.index.view';

/** Config CmsIndexConfig<GalleryListItem> — lihat CmsIndexComponent untuk
 *  kontrak lengkapnya, pola sama seperti Berita. Tanpa statusOptions —
 *  modul galeri tidak punya konsep publish/draft. Kolom 'coverThumb'
 *  murni visual (sortable:false, tidak ada di gallery_dto.GalleryListItem
 *  sebagai field sort), sel-nya di-render row template host. */
function buildGalleryIndexConfig(): CmsIndexConfig<GalleryListItem> {
  return {
    entityLabel: 'galeri',
    guideCards: [
      { icon: 'plus', title: 'Tambah Galeri', description: 'Klik <strong>"+ Tambah Galeri"</strong> untuk mendokumentasikan kegiatan baru — isi nama, tema, sampul, hingga foto tambahan.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari nama kegiatan atau tema secara terpisah, atau atur rentang tanggal dibuat — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat detail lengkap galeri beserta daftar fotonya.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu galeri lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    searchTargets: [
      { value: 'eventName', label: 'Nama Kegiatan' },
      { value: 'eventTheme', label: 'Tema' },
    ],
    showDateRange: true,
    columns: [
      { key: 'coverThumb', label: 'Sampul', sortable: false },
      { key: 'eventName', label: 'Nama Kegiatan', locked: true },
      { key: 'eventTheme', label: 'Tema' },
      { key: 'totalPhotos', label: 'Total Foto' },
      { key: 'eventDate', label: 'Tanggal Kegiatan' },
      { key: 'createdDate', label: 'Dibuat Pada' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'galleryID',
    emptyIcon: 'images',
    emptyTitle: 'Belum ada data galeri',
    emptyDescription: 'Dokumentasi galeri kegiatan yang Anda buat akan muncul di sini.',
    createRoute: '/cms/galleries/form',
    createLabel: 'Tambah Galeri',
  };
}

@Component({
  selector: 'app-gallery-index-page',
  standalone: true,
  templateUrl: './gallery.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [GalleryIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .cover-thumb { width: 44px; height: 44px; border-radius: 6px; border: 1px solid var(--color-border); object-fit: cover; display: block; background: var(--color-bg-alt); }
  `],
})
export class GalleryIndexPage implements OnInit, GalleryIndexView {
  private presenter = inject(GalleryIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<GalleryListItem>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('gallery.create');
  canUpdate = this.auth.hasPermission('gallery.update');
  canDelete = this.auth.hasPermission('gallery.delete');

  readonly config = buildGalleryIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewGallery(g: GalleryListItem): void { this.router.navigate(['/cms/galleries/view', g.galleryID]); }

  async remove(g: GalleryListItem, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus galeri "${g.eventTheme}"? Semua foto terkait akan ikut terhapus secara permanen.`, {
      title: 'Hapus Galeri', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(g.galleryID);
    this.presenter.remove(g.galleryID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
