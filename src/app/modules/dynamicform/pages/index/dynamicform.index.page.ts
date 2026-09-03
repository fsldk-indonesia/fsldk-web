import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { DynamicForm } from '../../entities/dynamic-form';
import { STATUS_META, statusMeta } from '../../dynamicform.constants';
import { dynamicFormPath } from '../../dynamicform.path';
import { DynamicFormIndexPresenter } from './dynamicform.index.presenter';
import { DynamicFormIndexView } from './dynamicform.index.view';

@Component({
  selector: 'app-dynamicform-index-page',
  standalone: true,
  templateUrl: './dynamicform.index.page.html',
  imports: [DatePipe, RouterLink, FormsModule, IconComponent, SelectComponent, PaginationComponent],
  providers: [DynamicFormIndexPresenter],
  styles: [`
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .filters input { min-width: 220px; }
    .filters .app-select { width: 180px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--color-border); font-size: .9rem; vertical-align: middle; }
    .row-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .72rem; font-weight: 600; }
    .badge-success { background: #e1f5e9; color: #00712e; }
    .badge-warn { background: #fff3d6; color: #92600a; }
    .badge-muted { background: var(--color-surface-2, #eef0ee); color: var(--color-text-secondary); }
    .bulk-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .muted { color: var(--color-text-secondary); font-size: .82rem; }
  `],
})
export class DynamicFormIndexPage implements OnInit, DynamicFormIndexView {
  private presenter = inject(DynamicFormIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  readonly path = dynamicFormPath;
  forms = signal<DynamicForm[]>([]);
  loading = signal(true);
  search = '';
  status = '';
  sort = '-createdDate';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());
  selected = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('dynamicform.create');
  canUpdate = this.auth.hasPermission('dynamicform.update');
  canPublish = this.auth.hasPermission('dynamicform.publish');
  canDelete = this.auth.hasPermission('dynamicform.delete');

  statusOptions = [{ value: '', label: 'Semua Status' }, ...STATUS_META.map((s) => ({ value: s.value, label: s.label }))];
  statusMeta = statusMeta;

  selectedCount = computed(() => this.selected().size);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.selected.set(new Set());
    this.presenter.load(this.page(), this.limit, this.search, this.status, this.sort);
  }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }

  isSelected(id: number): boolean { return this.selected().has(id); }
  toggleSelect(id: number): void {
    this.selected.update((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  toggleAll(checked: boolean): void {
    this.selected.set(checked ? new Set(this.forms().map((f) => f.formID)) : new Set());
  }

  nextStatuses(f: DynamicForm): { value: string; label: string }[] {
    return STATUS_META.filter((s) => s.value !== f.status).map((s) => ({ value: s.value, label: s.label }));
  }

  changeStatus(f: DynamicForm, status: string): void {
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

  async bulkDelete(event?: Event): Promise<void> {
    const ids = [...this.selected()];
    if (ids.length === 0) return;
    const ok = await this.alert.confirm(
      `Hapus ${ids.length} formulir terpilih beserta seluruh tanggapannya?`,
      { title: 'Hapus Massal', confirmLabel: 'Ya, Hapus Semua', variant: 'danger' }, event,
    );
    if (!ok) return;
    this.presenter.bulkDelete(ids);
  }

  setForms(forms: DynamicForm[], count: number): void { this.forms.set(forms); this.count.set(count); this.loading.set(false); }
  onActionSettled(id: number): void { this.busy.update((s) => { const n = new Set(s); n.delete(id); return n; }); }
  onMutated(): void { this.load(); }
}
