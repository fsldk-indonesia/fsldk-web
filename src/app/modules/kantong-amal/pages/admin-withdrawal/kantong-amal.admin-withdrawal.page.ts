import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { CmsIndexComponent } from '../../../../shared/cms-index/cms-index.component';
import { CmsIndexConfig, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { Withdrawal } from '../../entities/withdrawal';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalAdminWithdrawalPresenter } from './kantong-amal.admin-withdrawal.presenter';
import { KantongAmalAdminWithdrawalView } from './kantong-amal.admin-withdrawal.view';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Diajukan', SECURITY_CHECK: 'Verifikasi Keamanan', APPROVED: 'Siap Diproses',
  PROCESSING: 'Diproses', SUCCESS: 'Berhasil', FAILED: 'Gagal',
  REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan', REVERSED: 'Dibatalkan Sistem',
};

/** Config CmsIndexConfig<Withdrawal> — TIDAK ada bulkDeleteEnabled: penarikan
 *  adalah catatan finansial, tidak pernah bisa dihapus (tidak seperti
 *  Campaign/Donasi). "View row" sudah lama ada lewat halaman Detail
 *  Penarikan (timeline status + polling), row click di sini cukup
 *  mengarahkan ke sana. */
function buildWithdrawalIndexConfig(): CmsIndexConfig<Withdrawal> {
  return {
    entityLabel: 'penarikan',
    guideCards: [
      { icon: 'plus', title: 'Ajukan Penarikan', description: 'Klik <strong>"Penarikan Saldo"</strong> untuk mencairkan saldo campaign ke rekening tujuan.' },
      { icon: 'search', title: 'Filter & Pencarian', description: 'Cari ref penarikan atau judul campaign, pilih status, atau atur rentang tanggal diajukan.' },
      { icon: 'eye', title: 'Lihat Detail', description: 'Klik baris mana pun untuk melihat timeline status lengkap sebuah penarikan.' },
    ],
    statusOptions: [
      { value: 'REQUESTED', label: 'Diajukan' },
      { value: 'SECURITY_CHECK', label: 'Verifikasi Keamanan' },
      { value: 'APPROVED', label: 'Siap Diproses' },
      { value: 'PROCESSING', label: 'Diproses' },
      { value: 'SUCCESS', label: 'Berhasil' },
      { value: 'FAILED', label: 'Gagal' },
      { value: 'REJECTED', label: 'Ditolak' },
      { value: 'CANCELLED', label: 'Dibatalkan' },
      { value: 'REVERSED', label: 'Dibatalkan Sistem' },
    ],
    searchTargets: [
      { value: 'search', label: 'Ref / Campaign' },
    ],
    showDateRange: true,
    columns: [
      { key: 'campaignTitle', label: 'Campaign', locked: true, sortable: false },
      { key: 'amount', label: 'Nominal' },
      { key: 'beneficiary', label: 'Rekening', sortable: false },
      { key: 'status', label: 'Status', sortable: false },
      { key: 'createdDate', label: 'Diajukan' },
    ],
    defaultSort: { sortBy: 'createdDate', sortDir: 'desc' },
    rowIdKey: 'withdrawalID',
    limit: 15,
    emptyIcon: 'hand-coins',
    emptyTitle: 'Tidak ada penarikan',
    emptyDescription: 'Pengajuan penarikan saldo campaign akan muncul di sini.',
    createRoute: kantongAmalPath.withdrawalCreate,
    createLabel: 'Penarikan Saldo',
  };
}

@Component({
  selector: 'app-kantong-amal-admin-withdrawal-page',
  standalone: true,
  templateUrl: './kantong-amal.admin-withdrawal.page.html',
  imports: [DatePipe, UpperCasePipe, RouterLink, IconComponent, CmsIndexComponent],
  providers: [KantongAmalAdminWithdrawalPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; }
    .status-SUCCESS { background: #dcfce7; color: #166534; }
    .status-FAILED, .status-REJECTED, .status-REVERSED { background: #fee2e2; color: #991b1b; }
    .status-CANCELLED { background: #f3f4f6; color: #4b5563; }
    .status-REQUESTED, .status-SECURITY_CHECK, .status-APPROVED, .status-PROCESSING { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .table-actions { justify-content: center; }
  `],
})
export class KantongAmalAdminWithdrawalPage implements OnInit, KantongAmalAdminWithdrawalView {
  private presenter = inject(KantongAmalAdminWithdrawalPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private router = inject(Router);

  @ViewChild(CmsIndexComponent) private table!: CmsIndexComponent<Withdrawal>;

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;
  busyIDs = signal<Set<number>>(new Set());

  canRequest = this.auth.hasPermission('kantong_amal.withdrawal.request');
  canProcess = this.auth.hasPermission('kantong_amal.withdrawal.process');

  readonly config = buildWithdrawalIndexConfig();
  dataSource = (params: CmsListParams) => this.presenter.list(params);

  ngOnInit(): void { this.presenter.attachView(this); }

  statusLabel(s: string): string { return STATUS_LABELS[s] ?? s; }
  isBusy(id: number): boolean { return this.busyIDs().has(id); }

  viewWithdrawal(w: Withdrawal): void { this.router.navigate([this.kantongAmalPath.withdrawalDetail(w.withdrawalID)]); }

  async process(w: Withdrawal, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.alert.confirm(`Proses pencairan ${this.formatRupiah(w.amount)}? Ini akan mengeksekusi transfer ke rekening tujuan.`, { variant: 'danger' }, event);
    if (ok) this.presenter.process(w.withdrawalID);
  }

  setBusy(id: number, busy: boolean): void {
    const next = new Set(this.busyIDs());
    if (busy) next.add(id); else next.delete(id);
    this.busyIDs.set(next);
  }
  onActionSettled(id: number): void { this.setBusy(id, false); }
  onMutated(): void { this.table.refresh(); }
}
