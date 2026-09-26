import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { DynamicForm } from '../../entities/dynamic-form';
import { STATUS_META, StatusMeta, nextStatusMeta, statusMeta } from '../../dynamicform.constants';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormIndexPresenter } from './dynamicform.index.presenter';
import { DynamicFormIndexView } from './dynamicform.index.view';

/** Config CmsIndexConfig<DynamicForm> — lihat CmsIndexComponent untuk
 *  kontrak lengkapnya, pola sama seperti Berita. Status (draft/published/
 *  closed) genuinely multi-select bermakna — sama pola dengan Job Queue. */
function buildDynamicFormIndexConfig(): CmsIndexConfig<DynamicForm> {
  return {
    entityLabel: 'formulir',
    guideCards: [
      { icon: 'plus', title: 'Buat Formulir', description: 'Klik <strong>"Buat Formulir"</strong> untuk mengisi judul & pengaturan dasar, lalu lanjut ke Builder untuk menyusun field-nya.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari judul formulir, pilih status, atau atur rentang tanggal dibuat — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat detail pengaturan formulir, atau ikon pensil untuk mengubahnya.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus satu formulir lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong> untuk hapus massal.' },
    ],
    statusOptions: STATUS_META.map((s) => ({ value: s.value, label: s.label })),
    searchTargets: [
      { value: 'search', label: 'Judul Formulir' },
    ],
    showDateRange: true,
    columns: [
      { key: 'title', label: 'Judul Formulir', locked: true },
      { key: 'status', label: 'Status' },
      { key: 'totalSubmission', label: 'Tanggapan' },
      { key: 'creatorName', label: 'Dibuat Oleh', sortable: false },
      { key: 'createdDate', label: 'Tanggal Dibuat' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'formID',
    emptyIcon: 'clipboard-list',
    emptyTitle: 'Belum ada formulir',
    emptyDescription: 'Formulir yang Anda buat akan muncul di sini.',
    createRoute: dynamicFormPath.create,
    createLabel: 'Buat Formulir',
  };
}

@Component({
  selector: 'app-dynamicform-index-page',
  standalone: true,
  templateUrl: './dynamicform.index.page.html',
  imports: [DatePipe, RouterLink, IconComponent, CmsIndexComponent],
  providers: [DynamicFormIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; } .table-actions { flex-wrap: nowrap; }`],
})
export class DynamicFormIndexPage implements OnInit, DynamicFormIndexView {
  private presenter = inject(DynamicFormIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<DynamicForm>;

  readonly path = dynamicFormPath;
  busy = signal<ReadonlySet<number>>(new Set());
  readonly statusMeta = statusMeta;

  canCreate = this.auth.hasPermission('dynamicform.create');
  canUpdate = this.auth.hasPermission('dynamicform.update');
  canPublish = this.auth.hasPermission('dynamicform.publish');
  canDelete = this.auth.hasPermission('dynamicform.delete');

  readonly config = buildDynamicFormIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  nextStatuses(f: DynamicForm): StatusMeta[] {
    const next = nextStatusMeta(f.status);
    return next ? [next] : [];
  }

  viewForm(f: DynamicForm): void { this.router.navigate([this.path.view(f.formID)]); }

  changeStatus(f: DynamicForm, status: string, event?: Event): void {
    event?.stopPropagation();
    if (!status || status === f.status) return;
    this.setBusy(f.formID);
    this.presenter.setStatus(f, status);
  }

  async remove(f: DynamicForm, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(
      `Hapus formulir "${f.title}"? Seluruh tanggapan & berkasnya ikut terhapus permanen.`,
      { title: 'Hapus Formulir', confirmLabel: 'Ya, Hapus', variant: 'danger' }, event,
    );
    if (!ok) return;
    this.setBusy(f.formID);
    this.presenter.remove(f);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  onActionSettled(id: number): void { this.clearBusy(id); }
  onMutated(): void { this.table.refresh(); }
}
