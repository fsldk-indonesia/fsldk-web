import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Structure } from '../../entities/structure';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { StructureIndexPresenter } from './structure.index.presenter';
import { StructureIndexView } from './structure.index.view';

/** Config CmsIndexConfig<Structure> — lihat CmsIndexComponent untuk kontrak
 *  lengkapnya, pola sama seperti Berita. Tidak ada statusOptions — arsip
 *  struktur kepengurusan tidak punya konsep aktif/nonaktif seperti modul lain. */
function buildStructureIndexConfig(): CmsIndexConfig<Structure> {
  return {
    entityLabel: 'struktur',
    guideCards: [
      { icon: 'plus', title: 'Tambah Struktur', description: 'Klik <strong>"+ Tambah Struktur"</strong> untuk menambah arsip kepengurusan baru — isi angkatan, periode, logo, dan bagan organisasi.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari berdasarkan angkatan, periode, atau nama kepengurusan, atau atur rentang tanggal dibuat.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat detail lengkap struktur kepengurusan.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu struktur lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    searchTargets: [
      { value: 'search', label: 'Angkatan / Periode / Nama' },
    ],
    showDateRange: true,
    columns: [
      { key: 'structureName', label: 'Nama Kepengurusan', locked: true },
      { key: 'batch', label: 'Angkatan / Periode' },
      { key: 'createdDate', label: 'Dibuat Pada' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'structureID',
    emptyIcon: 'sitemap',
    emptyTitle: 'Belum ada data struktur',
    emptyDescription: 'Data kepengurusan organisasi yang Anda buat akan muncul di sini.',
    createRoute: '/cms/structures/create',
    createLabel: 'Tambah Struktur',
  };
}

@Component({
  selector: 'app-structure-index',
  standalone: true,
  templateUrl: './structure.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [StructureIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class StructureIndexPage implements OnInit, StructureIndexView {
  private presenter = inject(StructureIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Structure>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('structure.create');
  canUpdate = this.auth.hasPermission('structure.update');
  canDelete = this.auth.hasPermission('structure.delete');

  readonly config = buildStructureIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  viewStructure(s: Structure): void { this.router.navigate(['/cms/structures', s.structureID, 'view']); }

  async remove(s: Structure, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus data struktur "${s.structureName}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Struktur', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(s.structureID);
    this.presenter.remove(s);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
