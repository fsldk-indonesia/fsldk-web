import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { FinanceAuditLogItem } from '../../entities/audit-log';
import { IconComponent } from '../../../../shared/icon.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { KantongAmalAdminAuditLogPresenter } from './kantong-amal.admin-audit-log.presenter';

/** Config CmsIndexConfig<FinanceAuditLogItem> — tanpa createRoute/statusOptions/
 *  bulkDeleteEnabled: log murni sistem-generated & tidak pernah bisa dihapus
 *  (immutable audit trail), sama filosofinya dengan Job Queue tapi lebih
 *  ketat (Job Queue masih boleh dihapus setelah failed/completed). Backend
 *  selalu urut logID DESC (tidak ada sort dinamis), jadi semua kolom
 *  sortable:false. Entity & Aksi adalah dua target search independen
 *  (exact match), bukan satu free-text gabungan. */
function buildAuditLogIndexConfig(): CmsIndexConfig<FinanceAuditLogItem> {
  return {
    entityLabel: 'log audit',
    guideCards: [
      { icon: 'search', title: 'Filter & Pencarian', description: 'Pilih target <strong>Entity</strong> atau <strong>Aksi</strong> lalu ketik nilainya, atau atur rentang tanggal.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat rincian lengkap perubahan (before/after) dalam format JSON.' },
      { icon: 'lock', title: 'Hanya Baca', description: 'Audit log adalah jejak permanen — tidak ada aksi ubah atau hapus di sini.' },
    ],
    searchTargets: [
      { value: 'entity', label: 'Entity' },
      { value: 'action', label: 'Aksi' },
    ],
    showDateRange: true,
    columns: [
      { key: 'createdDate', label: 'Waktu', locked: true, sortable: false },
      { key: 'action', label: 'Aksi', sortable: false },
      { key: 'entity', label: 'Entity', sortable: false },
      { key: 'entityID', label: 'ID', sortable: false },
      { key: 'actorName', label: 'Aktor', sortable: false },
      { key: 'changes', label: 'Perubahan', sortable: false },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'logID',
    limit: 20,
    emptyIcon: 'list',
    emptyTitle: 'Belum ada audit log',
    emptyDescription: 'Aktivitas finansial Kantong Amal — campaign, donasi, withdrawal, saldo — akan tercatat di sini.',
  };
}

@Component({
  selector: 'app-kantong-amal-admin-audit-log-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-audit-log.page.html',
  imports: [DatePipe, IconComponent, ModalBackdropDirective, CmsIndexComponent],
  providers: [KantongAmalAdminAuditLogPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .json-preview { font-family: monospace; font-size: .78rem; color: var(--color-text-secondary); white-space: pre-wrap; max-width: 280px; max-height: 60px; overflow: hidden; text-overflow: ellipsis; }

    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       pola sama persis seperti popup Job Queue/Pengguna/Pesan Kontak. */
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
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 560px; max-height: 86vh; display: flex; flex-direction: column;
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
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
      font-family: var(--font-heading); font-weight: 700; font-size: .72rem;
      letter-spacing: .07em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .field-card { display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff; padding: 16px; }
    .field-card .form-group { margin-bottom: 0; }
    .json-block { font-family: monospace; font-size: .8rem; background: var(--color-bg-alt); border-radius: var(--radius-xs); padding: 12px; white-space: pre-wrap; word-break: break-word; max-height: 220px; overflow-y: auto; margin: 0; }
  `],
})
export class KantongAmalAdminAuditLogPage implements OnInit {
  private presenter = inject(KantongAmalAdminAuditLogPresenter);

  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  showDetail = signal(false);
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  selectedLog = signal<FinanceAuditLogItem | null>(null);

  readonly config = buildAuditLogIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  formatJson(raw?: string): string {
    if (!raw) return '';
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
  }

  openView(log: FinanceAuditLogItem): void {
    this.popupOrigin.set(popupOriginFromEvent());
    this.selectedLog.set(log);
    this.showDetail.set(true);
    this.animateModal(true);
  }

  close(): void {
    this.animateModal(false);
    this.showDetail.set(false);
  }

  /** Buka/tutup modal digerakkan lewat Web Animations API — pola & alasan
   *  sama persis seperti popup Job Queue/Pengguna/Pesan Kontak. */
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
}
