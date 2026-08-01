import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleService, UserService } from '../../core/services/data.services';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Role, UserRow } from '../../core/models/models';

@Component({
  selector: 'app-cms-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex justify-between items-center page-head">
      <div><h1>Manajemen Pengguna</h1><p class="text-muted">Kelola akun & peran pengguna CMS.</p></div>
      @if (canCreate) { <button class="btn btn-primary" (click)="openCreate()">+ Tambah Pengguna</button> }
    </div>

    <div class="card">
      <div class="card-pad flex gap">
        <input class="form-control" [(ngModel)]="search" (keyup.enter)="load()" placeholder="Cari pengguna…">
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            @for (u of users(); track u.userID) {
              <tr>
                <td><strong>{{ u.fullName }}</strong></td>
                <td class="text-muted">{{ u.email }}</td>
                <td><span class="chip chip-green">{{ u.role }}</span></td>
                <td><span class="badge" [class.badge-active]="u.isActive" [class.badge-inactive]="!u.isActive">{{ u.isActive ? 'Aktif' : 'Nonaktif' }}</span></td>
                <td>
                  <div class="table-actions">
                    @if (canUpdate) { <span class="link-action" (click)="openEdit(u)">Edit</span> }
                    @if (canUpdate) { <span class="link-action" (click)="reset(u)">Reset PW</span> }
                    @if (canDelete) { <span class="link-danger" (click)="remove(u)">Hapus</span> }
                  </div>
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="text-muted">Tidak ada pengguna.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>

    @if (showForm()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editId ? 'Ubah Pengguna' : 'Tambah Pengguna' }}</h3>
          <div class="form-group"><label class="form-label">Nama Lengkap</label><input class="form-control" [(ngModel)]="form.fullName"></div>
          @if (!editId) { <div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" [(ngModel)]="form.email"></div> }
          @if (!editId) { <div class="form-group"><label class="form-label">Kata Sandi</label><input class="form-control" type="password" [(ngModel)]="form.password"></div> }
          <div class="form-group"><label class="form-label">Role</label>
            <select class="form-control" [(ngModel)]="form.roleID">
              @for (r of roles(); track r.roleID) { <option [value]="r.roleID">{{ r.roleName }}</option> }
            </select>
          </div>
          <div class="form-group"><label class="form-label"><input type="checkbox" [(ngModel)]="form.isActive"> Aktif</label></div>
          <div class="flex gap justify-between">
            <button class="btn btn-ghost" (click)="close()">Batal</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving()">Simpan</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 460px; }
  `],
})
export class CmsUsersComponent implements OnInit {
  private userSvc = inject(UserService);
  private roleSvc = inject(RoleService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  users = signal<UserRow[]>([]);
  roles = signal<Role[]>([]);
  search = '';
  showForm = signal(false);
  saving = signal(false);
  editId: number | null = null;
  form: { fullName: string; email: string; password: string; roleID: number; isActive: boolean } =
    { fullName: '', email: '', password: '', roleID: 0, isActive: true };

  canCreate = this.auth.hasPermission('user.create');
  canUpdate = this.auth.hasPermission('user.update');
  canDelete = this.auth.hasPermission('user.delete');

  ngOnInit(): void {
    this.load();
    this.roleSvc.list().subscribe({ next: (r) => this.roles.set(r), error: () => {} });
  }

  load(): void {
    this.userSvc.list({ page: 1, limit: 50, search: this.search }).subscribe({ next: (p) => this.users.set(p.data), error: () => {} });
  }

  openCreate(): void {
    this.editId = null;
    this.form = { fullName: '', email: '', password: '', roleID: this.roles()[0]?.roleID ?? 0, isActive: true };
    this.showForm.set(true);
  }
  openEdit(u: UserRow): void {
    this.editId = u.userID;
    this.form = { fullName: u.fullName, email: u.email, password: '', roleID: u.roleID, isActive: u.isActive };
    this.showForm.set(true);
  }
  close(): void { this.showForm.set(false); }

  save(): void {
    this.saving.set(true);
    const done = () => { this.saving.set(false); this.showForm.set(false); this.load(); };
    if (this.editId) {
      this.userSvc.update(this.editId, { fullName: this.form.fullName, roleID: +this.form.roleID, isActive: this.form.isActive })
        .subscribe({ next: () => { this.toast.success('Pengguna diperbarui'); done(); }, error: () => this.saving.set(false) });
    } else {
      this.userSvc.create({ fullName: this.form.fullName, email: this.form.email, password: this.form.password, roleID: +this.form.roleID, isActive: this.form.isActive })
        .subscribe({ next: () => { this.toast.success('Pengguna dibuat'); done(); }, error: () => this.saving.set(false) });
    }
  }

  reset(u: UserRow): void {
    this.userSvc.resetPassword(u.userID).subscribe({ next: (r) => this.toast.success('Password sementara: ' + r.temporaryPassword), error: () => {} });
  }
  remove(u: UserRow): void {
    if (!confirm(`Hapus pengguna ${u.fullName}?`)) return;
    this.userSvc.remove(u.userID).subscribe({ next: () => { this.toast.success('Pengguna dihapus'); this.load(); }, error: () => {} });
  }
}
