import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { PopupOrigin, popupOriginFromEvent } from '../../../../core/utils/popup-origin';
import { UserRow } from '../../entities/user';
import { Role } from '../../../role/entities/role';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent } from '../../../../shared/select.component';
import { UserFormValue, UserIndexPresenter } from './user.index.presenter';
import { UserIndexView } from './user.index.view';

@Component({
  selector: 'app-user-index-page',
  standalone: true,
  templateUrl: './user.index.page.html',
  imports: [FormsModule, IconComponent, PaginationComponent, SelectComponent],
  providers: [UserIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 460px; }
  `],
})
export class UserIndexPage implements OnInit, UserIndexView {
  private presenter = inject(UserIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  users = signal<UserRow[]>([]);
  roles = signal<Role[]>([]);
  loading = signal(true);
  search = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  showForm = signal(false);
  saving = signal(false);
  busy = signal<ReadonlySet<number>>(new Set());
  popupOrigin = signal<PopupOrigin>({ dx: 0, dy: 0 });
  editId: number | null = null;
  form: UserFormValue = { fullName: '', email: '', password: '', roleID: 0, isActive: true };

  roleOptions = computed(() => this.roles().map((r) => ({ value: r.roleID, label: r.roleName })));

  canCreate = this.auth.hasPermission('user.create');
  canUpdate = this.auth.hasPermission('user.update');
  canDelete = this.auth.hasPermission('user.delete');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
    this.presenter.loadRoles();
  }

  load(): void { this.loading.set(true); this.presenter.loadUsers(this.page(), this.limit, this.search); }
  applySearch(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  openCreate(event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.editId = null;
    this.form = { fullName: '', email: '', password: '', roleID: this.roles()[0]?.roleID ?? 0, isActive: true };
    this.showForm.set(true);
  }
  openEdit(u: UserRow, event?: Event): void {
    this.popupOrigin.set(popupOriginFromEvent(event));
    this.editId = u.userID;
    this.form = { fullName: u.fullName, email: u.email, password: '', roleID: u.roleID, isActive: u.isActive };
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  save(): void { this.presenter.save(this.editId, this.form); }
  async remove(u: UserRow, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus pengguna ${u.fullName}? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Pengguna', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(u.userID);
    this.presenter.remove(u.userID);
  }

  setUsers(users: UserRow[], count: number): void { this.users.set(users); this.count.set(count); this.loading.set(false); }
  setRoles(roles: Role[]): void { this.roles.set(roles); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveSuccess(): void { this.showForm.set(false); this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
