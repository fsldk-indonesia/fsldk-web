import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { Job, JobStats } from '../../entities/job';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { JobQueueIndexPresenter } from './jobqueue.index.presenter';
import { JobQueueIndexView } from './jobqueue.index.view';

/** Config CmsIndexConfig<Job> — lihat CmsIndexComponent untuk kontrak
 *  lengkapnya, pola sama seperti Berita. Tanpa createRoute/createLabel —
 *  job dibuat sistem, bukan lewat CMS (sama seperti Komentar). Status
 *  (pending/processing/completed/failed) & Queue keduanya genuinely
 *  multi-select bermakna (mis. lihat failed+processing sekaligus untuk
 *  triase), beda dari published/draft di modul lain yang cuma dua nilai. */
function buildJobQueueIndexConfig(presenter: JobQueueIndexPresenter): CmsIndexConfig<Job> {
  return {
    entityLabel: 'job',
    guideCards: [
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari job type atau pesan error, pilih status, pilih Queue, atau atur rentang tanggal — bisa digabung sekaligus.' },
      { icon: 'chevrons-up-down', title: 'Urutkan & Atur Kolom', description: 'Klik judul kolom untuk mengurutkan data, atau pakai <strong>Atur Kolom</strong> untuk menampilkan/menyembunyikan kolom.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat detail lengkap job — payload percobaan, error, dan korelasinya.' },
      { icon: 'refresh', title: 'Retry Job Gagal', description: 'Job berstatus <strong>Failed</strong> bisa dicoba ulang lewat ikon refresh di kolom Aksi.' },
      { icon: 'trash', title: 'Hapus & Aksi Massal', description: 'Hapus job failed/completed lewat ikon tempat sampah, atau centang beberapa baris lalu pakai <strong>Aksi Massal</strong>.' },
    ],
    statusOptions: [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
    ],
    searchTargets: [
      { value: 'search', label: 'Job Type / Error' },
      { value: 'queue', label: 'Queue', mode: 'combobox', loadOptions: () => presenter.queueOptions() },
    ],
    showDateRange: true,
    columns: [
      { key: 'jobID', label: 'ID', sortable: false },
      { key: 'queue', label: 'Queue' },
      { key: 'jobType', label: 'Job Type', sortable: false },
      { key: 'status', label: 'Status' },
      { key: 'attempts', label: 'Percobaan', sortable: false },
      { key: 'lastError', label: 'Error', sortable: false },
      { key: 'createdDate', label: 'Dibuat' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'jobID',
    emptyIcon: 'list-checks',
    emptyTitle: 'Belum ada job',
    emptyDescription: 'Job pengiriman WhatsApp & email akan muncul di sini.',
  };
}

@Component({
  selector: 'app-jobqueue-index-page',
  standalone: true,
  templateUrl: './jobqueue.index.page.html',
  imports: [DatePipe, IconComponent, ModalBackdropDirective, CmsIndexComponent],
  providers: [JobQueueIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-tile { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; }
    .stat-tile .value { font-size: 1.5rem; font-weight: 800; }
    .stat-tile .label { font-size: .8rem; color: var(--color-muted); }
    .stat-tile.stuck .value, .stat-tile.failed .value { color: var(--color-danger); }
    code.key { background: var(--color-bg-alt); padding: 2px 6px; border-radius: 4px; font-size: .82rem; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama persis seperti popup Pengguna/Pesan Kontak/Subscription. */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear var(--motion-slow);
    }
    .modal-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear 0s;
    }
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 520px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }

    .modal > h3 { flex-shrink: 0; margin-bottom: 2px; }
    .modal > p.text-muted { flex-shrink: 0; margin: 0 0 18px; font-size: .85rem; }
    .modal-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 18px;
      border-radius: var(--radius-xs); background: var(--color-bg-alt);
      box-shadow: inset 0 8px 10px -8px rgba(20,23,26,.14), inset 0 -8px 10px -8px rgba(20,23,26,.14);
    }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; padding-top: 18px; margin-top: 4px; border-top: 1px solid var(--color-border); }
    .modal-footer.footer-between { justify-content: space-between; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }
    .field-card .form-section-label { margin: 0; }
  `],
})
export class JobQueueIndexPage implements OnInit, JobQueueIndexView {
  private presenter = inject(JobQueueIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Job>;
  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  stats = signal<JobStats | null>(null);
  busy = signal<ReadonlySet<number>>(new Set());
  showForm = signal(false);
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  selectedJob = signal<Job | null>(null);

  canRetry = this.auth.hasPermission('jobqueue.retry');
  canDelete = this.auth.hasPermission('jobqueue.delete');

  readonly config = buildJobQueueIndexConfig(this.presenter);
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadStats();
  }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  openView(job: Job): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.selectedJob.set(null);
    this.showForm.set(true);
    this.animateModal(true);
    this.presenter.loadDetail(job.jobID);
  }

  close(): void {
    this.animateModal(false);
    this.showForm.set(false);
  }

  retryFromModal(): void {
    const job = this.selectedJob();
    if (!job) return;
    this.setBusy(job.jobID);
    this.presenter.retry(job.jobID);
  }

  /** Buka/tutup modal digerakkan lewat Web Animations API — pola & alasan
   *  sama persis seperti popup Pengguna/Pesan Kontak/Subscription. */
  private animateModal(opening: boolean): void {
    const el = this.modalEl?.nativeElement;
    if (!el) return;
    this.modalAnimation?.cancel();
    const { dx, dy } = this.popupOrigin();
    const closed: Keyframe = { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.25)` };
    const open: Keyframe = { opacity: 1, transform: 'none' };
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const anim = el.animate(opening ? [closed, open] : [open, closed], {
      duration: reduceMotion ? 1 : 250,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'forwards',
    });
    this.modalAnimation = anim;
    anim.onfinish = () => {
      anim.cancel();
      if (this.modalAnimation === anim) this.modalAnimation = null;
    };
  }

  retry(job: Job, event?: Event): void {
    event?.stopPropagation();
    this.setBusy(job.jobID);
    this.presenter.retry(job.jobID);
  }

  async remove(job: Job, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus job #${job.jobID} (${job.jobType})? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Job', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(job.jobID);
    this.presenter.remove(job.jobID);
  }

  onBulkDelete(ids: (string | number)[]): void { this.presenter.bulkDelete(ids as number[]); }

  // JobQueueIndexView
  setStats(stats: JobStats): void { this.stats.set(stats); }
  setDetail(job: Job): void { this.selectedJob.set(job); }
  onRetrySuccess(): void { this.close(); this.table.refresh(); this.presenter.loadStats(); }
  onRemoveSuccess(): void { this.close(); this.table.refresh(); this.presenter.loadStats(); }
  onBulkDeleteSuccess(): void { this.table.refresh(); this.presenter.loadStats(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
