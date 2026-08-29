import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LedgerListItem } from '../../entities/wallet';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalLedgerHistoryPresenter } from './kantong-amal.ledger-history.presenter';
import { KantongAmalLedgerHistoryView } from './kantong-amal.ledger-history.view';

const ENTRY_TYPE_LABELS: Record<string, string> = {
  DONATION_CREDIT: 'Donasi Masuk', WITHDRAWAL_RESERVE: 'Penarikan Direservasi', WITHDRAWAL_RELEASE: 'Reservasi Dilepas',
  REFUND_DEBIT: 'Refund', ADJUSTMENT_CREDIT: 'Penyesuaian (+)', ADJUSTMENT_DEBIT: 'Penyesuaian (-)', FEE_DEBIT: 'Biaya',
};

@Component({
  selector: 'app-kantong-amal-ledger-history-page',
  standalone: true,
  templateUrl: './kantong-amal.ledger-history.page.html',
  imports: [RouterLink, DatePipe, FormsModule, PaginationComponent],
  providers: [KantongAmalLedgerHistoryPresenter],
  styles: [`
    .page-head { max-width: 960px; margin: 0 auto 24px; }
    .card-wrap { max-width: 960px; margin: 0 auto; }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; padding: 16px; }
    .filters > * { flex: 1; min-width: 140px; }
    .credit { color: #166534; } .debit { color: #991b1b; }
  `],
})
export class KantongAmalLedgerHistoryPage implements OnInit, KantongAmalLedgerHistoryView {
  private presenter = inject(KantongAmalLedgerHistoryPresenter);
  private route = inject(ActivatedRoute);

  items = signal<LedgerListItem[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 15;
  entryType = '';
  dateFrom = '';
  dateTo = '';

  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;

  private campaignID = 0;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.campaignID = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void { this.presenter.load(this.campaignID, this.page(), this.limit, this.entryType, this.dateFrom, this.dateTo); }
  applyFilters(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  entryTypeLabel(t: string): string { return ENTRY_TYPE_LABELS[t] ?? t; }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setLedger(items: LedgerListItem[], count: number): void { this.items.set(items); this.count.set(count); }
}
