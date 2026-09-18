import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { SubmissionAnswersViewComponent } from '../../../submission/components/submission-answers-view.component';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionResponse, SubmissionDetail, SUBMISSION_STATUS_LABELS } from '../../../submission/entities/submission';
import { EXPORT_FORMAT_OPTIONS, ExportFormat } from '../../entities/report';
import { ReportListPresenter } from './report.list.presenter';
import { ReportListView } from './report.list.view';

/** Config CmsIndexConfig<SubmissionResponse> — dipakai identik untuk kedua
 *  rute yang memuat halaman ini, `reports/wilayah` (shell cms-puskomda,
 *  "Menu Laporan") & `reports/nasional` (shell cms-puskomnas, "Menu Laporan
 *  Nasional") — satu komponen yang sama (lihat report.routes.ts). Cakupan
 *  datanya sudah otomatis disaring backend berdasar organisasi caller (DL-11),
 *  jadi TIDAK ada percabangan tampilan seperti isNational() di
 *  organization.ldk-list.page.ts. */
function buildReportIndexConfig(): CmsIndexConfig<SubmissionResponse> {
  return {
    entityLabel: 'submission',
    statusOptions: Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    searchTargets: [{ value: 'search', label: 'Nama LDK' }],
    columns: [
      { key: 'organizationName', label: 'LDK', locked: true },
      { key: 'status', label: 'Status' },
      { key: 'submittedDate', label: 'Terkirim' },
    ],
    defaultSort: { sortBy: 'submittedDate', sortDir: 'desc' },
    rowIdKey: 'submissionID',
    emptyIcon: 'clipboard-list',
    emptyTitle: 'Tidak ada data',
    emptyDescription: 'Belum ada submission Levelisasi LDK yang masuk pada cakupan ini.',
  };
}

@Component({
  selector: 'app-report-list-page',
  standalone: true,
  templateUrl: './report.list.page.html',
  imports: [FormsModule, ModalBackdropDirective, SelectComponent, CmsIndexComponent, SubmissionAnswersViewComponent],
  providers: [ReportListPresenter],
  styles: [`
    .page-head { margin-bottom: 20px; } .page-head h1 { margin-bottom: 2px; }
    .toolbar { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
    .toolbar .field { min-width: 200px; }
    .toolbar .field .app-select { width: 100%; }

    /* Backdrop & modal SELALU ter-render (bukan @if) supaya transisi TUTUP
       juga kelihatan — pola sama persis dengan popup Audit Log Kantong Amal
       (kantong-amal.admin-audit-log.page.ts), yang juga dibuka dari klik
       baris <app-cms-index>. popupOrigin() karena itu selalu center
       (popupOriginFromEvent() tanpa argumen di select() — bukan dihitung
       dari koordinat tombol seperti openCreate/openEdit di modul lain). */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear var(--motion-slow);
    }
    .modal-backdrop.open {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity var(--motion-slow) var(--ease-out), visibility 0s linear 0s;
    }
    @media (prefers-reduced-motion: reduce) { .modal-backdrop { transition: none; } }

    /* Buka/tutup modal digerakkan lewat Web Animations API (lihat
       animateModal()) — BUKAN CSS transition, sama alasannya dengan popup
       Audit Log/Pengguna/Job Queue: CSS transition pada transform selalu
       memakai nilai ter-paint TERAKHIR sebagai titik awal, jadi origin popup
       yang baru saja berganti sambil modal masih tertutup tetap "nyangkut"
       di posisi lama. CSS di sini cuma merepresentasikan dua state statis
       (tertutup/terbuka di keadaan diam). */
    .modal.modal-pop {
      background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 640px; max-height: 86vh; display: flex; flex-direction: column;
      animation: none; opacity: 0; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.25);
    }
    .modal.modal-pop.open { opacity: 1; transform: none; }
    .modal-header { flex-shrink: 0; }
    .modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding-right: 8px; }
    .modal-footer { flex-shrink: 0; padding-top: 16px; }
  `],
})
export class ReportListPage implements OnInit, ReportListView {
  private presenter = inject(ReportListPresenter);
  private auth = inject(AuthRepository);
  private route = inject(ActivatedRoute);
  private orgContext = inject(OrgContextService);

  @ViewChild('modalEl') private modalEl?: ElementRef<HTMLElement>;
  private modalAnimation: Animation | null = null;

  title = this.route.snapshot.data['title'] as string;
  canExport = this.auth.hasPermission(this.route.snapshot.data['exportPermission'] as string);

  /** Menunggu resolusi organizationID pertama (org-switcher) sebelum
   *  me-mount <app-cms-index> — sama alasannya dengan puskomdaReady di
   *  organization.ldk-list.page.ts: dataSource-nya memuat data SEGERA saat
   *  di-mount (ngOnInit), request pertama tidak boleh memakai organizationID
   *  basi/undefined. */
  ready = signal(false);
  private currentOrganizationID = signal<number | undefined>(undefined);

  version = signal<FormVersionDetail | null>(null);
  detail = signal<SubmissionDetail | null>(null);
  detailLoading = signal(false);
  showDetail = signal(false);
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  exporting = signal(false);

  /** Nama LDK baris yang sedang dibuka — GET /submissions/:id tidak
   *  men-join ms_organization (tidak seperti list), jadi dipakai sebagai
   *  fallback bila detail yang baru datang kosong (lihat setDetail()). */
  private selectedOrganizationName: string | undefined;

  statusFilter: string | null = null;
  exportFormat: ExportFormat = 'xlsx';
  readonly formatOptions = EXPORT_FORMAT_OPTIONS;
  readonly statusFilterOptions: SelectOption[] = Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  readonly statusLabels = SUBMISSION_STATUS_LABELS;

  readonly config = buildReportIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params, this.currentOrganizationID());

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadVersion();
    this.orgContext.organizationID$(this.route).subscribe((id) => {
      this.currentOrganizationID.set(id);
      this.ready.set(true);
    });
  }

  statusLabel(code: string): string { return this.statusLabels[code] ?? code; }

  select(item: SubmissionResponse): void {
    this.selectedOrganizationName = item.organizationName;
    this.popupOrigin.set(popupOriginFromEvent());
    this.detail.set(null);
    this.detailLoading.set(true);
    this.showDetail.set(true);
    this.animateModal(true);
    this.presenter.openDetail(item.submissionID);
  }

  close(): void {
    this.animateModal(false);
    this.showDetail.set(false);
  }

  export(): void { this.presenter.export(this.statusFilter ?? undefined, this.exportFormat); }

  setVersion(version: FormVersionDetail): void { this.version.set(version); }
  setDetail(detail: SubmissionDetail): void {
    this.detail.set({ ...detail, organizationName: detail.organizationName || this.selectedOrganizationName });
    this.detailLoading.set(false);
  }
  onDetailError(): void { this.detailLoading.set(false); this.close(); }
  setExporting(exporting: boolean): void { this.exporting.set(exporting); }

  /** Buka/tutup modal digerakkan lewat Web Animations API — pola & alasan
   *  identik popup Audit Log Kantong Amal/Pengguna/Job Queue (lihat
   *  animateModal() masing-masing untuk penjelasan panjangnya): dx/dy dioper
   *  LANGSUNG sebagai nilai JS ke .animate(), tidak lewat custom property
   *  yang bisa "nyangkut" transisi lain saat origin berganti sambil modal
   *  masih tertutup. `fill:'forwards'` dilepas via `animation.cancel()`
   *  begitu selesai supaya elemen tidak terus-menerus jadi containing block
   *  baru untuk turunan position:fixed. */
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
