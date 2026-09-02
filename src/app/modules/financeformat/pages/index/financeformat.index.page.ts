import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { FinanceFormat } from '../../entities/finance-format';
import { FinanceFormatType } from '../../entities/finance-format-type';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { FinanceFormatIndexPresenter } from './financeformat.index.presenter';
import { FinanceFormatIndexView } from './financeformat.index.view';

@Component({
  selector: 'app-financeformat-index-page',
  standalone: true,
  templateUrl: './financeformat.index.page.html',
  imports: [RouterLink, FormsModule, DatePipe, IconComponent, SelectComponent, PaginationComponent],
  providers: [FinanceFormatIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class FinanceFormatIndexPage implements OnInit, FinanceFormatIndexView {
  private presenter = inject(FinanceFormatIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  items = signal<FinanceFormat[]>([]);
  types = signal<FinanceFormatType[]>([]);
  loading = signal(true);
  search = '';
  formatTypeID = 0;
  dateFrom = '';
  dateTo = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('financeformat.create');
  canUpdate = this.auth.hasPermission('financeformat.update');
  canPublish = this.auth.hasPermission('financeformat.publish');
  canDelete = this.auth.hasPermission('financeformat.delete');

  typeOptions = computed(() => [{ value: 0, label: 'Semua Kategori' }, ...this.types().map((t) => ({ value: t.formatTypeID, label: t.formatTypeName }))]);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadTypes();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.presenter.load({
      page: this.page(), limit: this.limit, search: this.search,
      formatTypeID: this.formatTypeID, dateFrom: this.dateFrom, dateTo: this.dateTo,
    });
  }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  togglePublish(f: FinanceFormat): void { this.setBusy(f.financeFormatID); this.presenter.togglePublish(f); }
  async remove(f: FinanceFormat, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus format "${f.fileName}"? Berkas ikut terhapus dari server dan tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Format Keuangan', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(f.financeFormatID);
    this.presenter.remove(f);
  }

  setItems(items: FinanceFormat[], count: number): void { this.items.set(items); this.count.set(count); this.loading.set(false); }
  setTypes(types: FinanceFormatType[]): void { this.types.set(types); }
  onPublishToggleSuccess(): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
