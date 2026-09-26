import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Schedule } from '../../entities/schedule';
import { SCHEDULE_CATEGORIES, categoryMeta, formatDateRange, formatTimeRange } from '../../schedule.constants';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ScheduleIndexPresenter } from './schedule.index.presenter';
import { ScheduleIndexView } from './schedule.index.view';

/** Config CmsIndexConfig<Schedule> — lihat CmsIndexComponent untuk kontrak
 *  lengkapnya, pola sama seperti Berita. Kategori memakai mode combobox
 *  dengan daftar TETAP (SCHEDULE_CATEGORIES) — tidak perlu loadOptions ke
 *  API karena kategori jadwal bukan master data dinamis. Filter Bulan/Tahun
 *  yang lama disederhanakan menjadi satu rentang tanggal (showDateRange),
 *  yang backend-nya sudah mendukung jendela overlap tanggal. */
function buildScheduleIndexConfig(): CmsIndexConfig<Schedule> {
  return {
    entityLabel: 'jadwal',
    guideCards: [
      { icon: 'plus', title: 'Tambah Jadwal', description: 'Klik <strong>"+ Tambah Jadwal"</strong> untuk menambah kegiatan baru — isi judul, kategori, jadwal, hingga lokasi.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, cari berdasarkan Judul atau Kategori, atau atur rentang tanggal pelaksanaan.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Detail & Status', description: 'Klik baris mana pun untuk melihat detail lengkap jadwal, atau ikon mata untuk mengaktifkan/menonaktifkan.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu jadwal lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
    searchTargets: [
      { value: 'title', label: 'Judul' },
      {
        value: 'category', label: 'Kategori', mode: 'combobox',
        loadOptions: () => of(SCHEDULE_CATEGORIES.map((c) => ({ id: c.value, label: c.label }))),
      },
    ],
    showDateRange: true,
    columns: [
      { key: 'title', label: 'Judul', locked: true },
      { key: 'category', label: 'Kategori' },
      { key: 'startDate', label: 'Tanggal' },
      { key: 'time', label: 'Waktu', sortable: false },
      { key: 'location', label: 'Lokasi', sortable: false },
      { key: 'isActive', label: 'Status' },
    ],
    defaultSort: { sortBy: 'startDate', sortDir: 'desc' },
    rowIdKey: 'scheduleID',
    emptyIcon: 'calendar-days',
    emptyTitle: 'Belum ada jadwal',
    emptyDescription: 'Jadwal yang Anda tambahkan akan muncul di sini.',
    createRoute: '/cms/schedules/form',
    createLabel: 'Tambah Jadwal',
  };
}

@Component({
  selector: 'app-schedule-index-page',
  standalone: true,
  templateUrl: './schedule.index.page.html',
  imports: [RouterLink, IconComponent, CmsIndexComponent],
  providers: [ScheduleIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .cat-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  `],
})
export class ScheduleIndexPage implements OnInit, ScheduleIndexView {
  private presenter = inject(ScheduleIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Schedule>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('schedule.create');
  canUpdate = this.auth.hasPermission('schedule.update');
  canPublish = this.auth.hasPermission('schedule.publish');
  canDelete = this.auth.hasPermission('schedule.delete');

  readonly config = buildScheduleIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  catLabel(value: string): string { return categoryMeta(value).label; }
  catColor(value: string): string { return categoryMeta(value).color; }
  dateText(s: Schedule): string { return formatDateRange(s); }
  timeText(s: Schedule): string { return formatTimeRange(s) || '—'; }

  viewSchedule(s: Schedule): void { this.router.navigate(['/cms/schedules/view', s.scheduleID]); }

  togglePublish(s: Schedule): void { this.setBusy(s.scheduleID); this.presenter.togglePublish(s); }

  async remove(s: Schedule, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus jadwal "${s.title}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Jadwal', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(s.scheduleID);
    this.presenter.remove(s);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onPublishToggleSuccess(_wasActive: boolean): void { this.table.refresh(); }
  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
