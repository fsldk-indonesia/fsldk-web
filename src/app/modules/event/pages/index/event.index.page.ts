import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Event as AppEvent } from '../../entities/event';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { EventIndexPresenter } from './event.index.presenter';
import { EventIndexView } from './event.index.view';

const TIMING_LABELS: Record<string, string> = { upcoming: 'Akan Datang', ongoing: 'Berlangsung', past: 'Selesai' };

/** Config CmsIndexConfig<Event> — lihat CmsIndexComponent untuk kontrak
 *  lengkapnya, pola sama seperti Berita. Kolom "Waktu" (status timing
 *  upcoming/ongoing/past) murni informasional (sortable:false — nilainya
 *  dihitung dari startDate/endDate, bukan kolom DB) TAPI tetap bisa
 *  difilter lewat search target combobox "Waktu" yang memetakan ke
 *  filter timing yang sudah didukung backend (dipakai listing publik). */
function buildEventIndexConfig(): CmsIndexConfig<AppEvent> {
  return {
    entityLabel: 'event',
    guideCards: [
      { icon: 'plus', title: 'Tambah Event', description: 'Klik <strong>"+ Tambah Event"</strong> untuk membuat event baru — isi judul, divisi, jadwal, lokasi, hingga kontak person.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih status, pilih kolom yang ingin dicari (Judul/Divisi), atau atur rentang tanggal mulai — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'edit', title: 'Edit Event', description: 'Klik ikon pensil untuk mengubah informasi event, termasuk status publikasinya.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu event lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: [
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
    ],
    searchTargets: [
      { value: 'title', label: 'Judul' },
      { value: 'division', label: 'Divisi' },
      {
        value: 'timing', label: 'Waktu', mode: 'combobox',
        loadOptions: () => of(Object.entries(TIMING_LABELS).map(([id, label]) => ({ id, label }))),
      },
    ],
    showDateRange: true,
    columns: [
      { key: 'eventTitle', label: 'Judul Event', locked: true },
      { key: 'eventDivision', label: 'Divisi' },
      { key: 'startDate', label: 'Tanggal Mulai' },
      { key: 'timing', label: 'Waktu', sortable: false },
      { key: 'isPublished', label: 'Status' },
    ],
    defaultSort: { sortBy: 'startDate', sortDir: 'desc' },
    rowIdKey: 'eventID',
    emptyIcon: 'calendar-days',
    emptyTitle: 'Belum ada event',
    emptyDescription: 'Event yang Anda tambahkan akan muncul di sini.',
    createRoute: '/cms/events/form',
    createLabel: 'Tambah Event',
  };
}

@Component({
  selector: 'app-event-index-page',
  standalone: true,
  templateUrl: './event.index.page.html',
  imports: [RouterLink, DatePipe, IconComponent, CmsIndexComponent],
  providers: [EventIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class EventIndexPage implements OnInit, EventIndexView {
  private presenter = inject(EventIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<AppEvent>;

  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('event.create');
  canUpdate = this.auth.hasPermission('event.update');
  canDelete = this.auth.hasPermission('event.delete');

  readonly config = buildEventIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  timingLabel(s: string): string { return TIMING_LABELS[s] ?? '–'; }

  viewEvent(e: AppEvent): void { this.router.navigate(['/cms/events/view', e.eventID]); }

  async remove(e: AppEvent, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus event "${e.eventTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Event', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(e.eventID);
    this.presenter.remove(e);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onRemoveSuccess(): void { this.table.refresh(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
