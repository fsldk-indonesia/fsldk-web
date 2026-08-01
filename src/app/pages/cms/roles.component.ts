import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/data.services';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Permission, Role } from '../../core/models/models';

@Component({
  selector: 'app-cms-roles',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head"><h1>Manajemen Role</h1><p class="text-muted">Atur peran dan hak akses (permission) pengguna.</p></div>

    <div class="grid grid-2">
      @for (r of roles(); track r.roleID) {
        <div class="card card-pad">
          <div class="flex justify-between items-center">
            <h3>{{ r.roleName }}</h3>
            @if (r.isSystemRole) { <span class="chip">Sistem</span> }
          </div>
          <p class="text-muted">{{ r.roleDescription }}</p>
          <div class="perm-chips">
            @for (p of r.permissions.slice(0, 6); track p) { <span class="chip chip-green">{{ p }}</span> }
            @if (r.permissions.length > 6) { <span class="chip">+{{ r.permissions.length - 6 }}</span> }
          </div>
          <div class="flex justify-between items-center mt">
            <span class="text-muted">{{ r.userCount }} pengguna</span>
            @if (canUpdate) { <button class="btn btn-outline btn-sm" (click)="openPerms(r)">Atur Permission</button> }
          </div>
        </div>
      }
    </div>

    @if (editing(); as r) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Permission — {{ r.roleName }}</h3>
          <p class="text-muted">Centang permission yang diberikan ke role ini.</p>
          <div class="perm-list">
            @for (mod of moduleKeys(); track mod) {
              <div class="perm-mod">
                <strong>{{ mod }}</strong>
                @for (p of grouped()[mod]; track p.permissionID) {
                  <label class="perm-item">
                    <input type="checkbox" [checked]="selected.has(p.permissionID)" (change)="toggle(p.permissionID)">
                    {{ p.permissionName }} <code>{{ p.permissionCode }}</code>
                  </label>
                }
              </div>
            }
          </div>
          <div class="flex gap justify-between mt">
            <button class="btn btn-ghost" (click)="close()">Batal</button>
            <button class="btn btn-primary" (click)="savePerms()" [disabled]="saving()">Simpan</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .perm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 560px; max-height: 86vh; overflow: auto; }
    .perm-list { display: flex; flex-direction: column; gap: 16px; margin: 16px 0; }
    .perm-mod strong { text-transform: capitalize; display: block; margin-bottom: 8px; }
    .perm-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: .9rem; }
    .perm-item code { color: var(--color-muted); font-size: .78rem; }
  `],
})
export class CmsRolesComponent implements OnInit {
  private roleSvc = inject(RoleService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  editing = signal<Role | null>(null);
  selected = new Set<number>();
  saving = signal(false);
  canUpdate = this.auth.hasPermission('role.update');

  ngOnInit(): void {
    this.load();
    this.roleSvc.permissions().subscribe({ next: (p) => this.permissions.set(p), error: () => {} });
  }

  load(): void { this.roleSvc.list().subscribe({ next: (r) => this.roles.set(r), error: () => {} }); }

  grouped(): Record<string, Permission[]> {
    return this.permissions().reduce((acc, p) => {
      (acc[p.moduleName] ||= []).push(p);
      return acc;
    }, {} as Record<string, Permission[]>);
  }
  moduleKeys(): string[] { return Object.keys(this.grouped()); }

  openPerms(r: Role): void {
    this.editing.set(r);
    this.selected = new Set(r.permissionIDs);
  }
  toggle(id: number): void { this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }
  close(): void { this.editing.set(null); }

  savePerms(): void {
    const r = this.editing();
    if (!r) return;
    this.saving.set(true);
    this.roleSvc.setPermissions(r.roleID, [...this.selected]).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Permission diperbarui'); this.close(); this.load(); },
      error: () => this.saving.set(false),
    });
  }
}
