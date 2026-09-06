import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { DynamicForm } from '../../entities/dynamic-form';
import { STATUS_META, StatusMeta, nextStatusMeta, statusMeta } from '../../dynamicform.constants';
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
    .page-head h1 { margin-bottom: 2px; }
    .toolbar .form-control { max-width: 280px; }
    .table-actions { flex-wrap: nowrap; }
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

  canCreate = this.auth.hasPermission('dynamicform.create');
  canUpdate = this.auth.hasPermission('dynamicform.update');
  canPublish = this.auth.hasPermission('dynamicform.publish');
  canDelete = this.auth.hasPermission('dynamicform.delete');

  statusOptions = [{ value: '', label: 'Semua Status' }, ...STATUS_META.map((s) => ({ value: s.value, label: s.label }))];
  statusMeta = statusMeta;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.presenter.load(this.page(), this.limit, this.search, this.status, this.sort);
  }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }

  nextStatuses(f: DynamicForm): StatusMeta[] {
    const next = nextStatusMeta(f.status);
    return next ? [next] : [];
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

  setForms(forms: DynamicForm[], count: number): void { this.forms.set(forms); this.count.set(count); this.loading.set(false); }
  onActionSettled(id: number): void { this.busy.update((s) => { const n = new Set(s); n.delete(id); return n; }); }
  onMutated(): void { this.load(); }
}
