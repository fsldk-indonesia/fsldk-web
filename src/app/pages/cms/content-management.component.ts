import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../core/services/data.services';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Content, OrgMember } from '../../core/models/models';

type OrgForm = { memberName: string; position: string; photoURL: string; level: string; sortOrder: number; isActive: boolean };

const EMPTY_ORG_FORM: OrgForm = { memberName: '', position: '', photoURL: '', level: '', sortOrder: 0, isActive: true };

@Component({
  selector: 'app-cms-content',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>Konten Halaman</h1>
      <p class="text-muted">Kelola isi Landing Page (visi, misi, kontak, dsb.) &amp; struktur organisasi.</p>
    </div>

    <div class="tabs">
      <span class="tab" [class.active]="tab() === 'content'" (click)="tab.set('content')">Konten Landing Page</span>
      <span class="tab" [class.active]="tab() === 'org'" (click)="tab.set('org')">Struktur Organisasi</span>
    </div>

    @if (tab() === 'content') {
      <div class="card">
        @for (c of contents(); track c.contentID) {
          <div class="content-row">
            <div class="content-head" (click)="toggle(c.contentID)">
              <div>
                <code>{{ c.contentKey }}</code>
                <strong>{{ c.contentTitle || '(tanpa judul)' }}</strong>
              </div>
              <span class="chevron" [class.open]="openKey() === c.contentID">▾</span>
            </div>
            @if (openKey() === c.contentID) {
              <div class="content-edit">
                <div class="form-group"><label class="form-label">Judul</label>
                  <input class="form-control" [(ngModel)]="draft.contentTitle" [disabled]="!canUpdate"></div>
                <div class="form-group"><label class="form-label">Isi</label>
                  <textarea class="form-control" rows="4" [(ngModel)]="draft.contentBody" [disabled]="!canUpdate"></textarea></div>
                @if (canUpdate) {
                  <div class="flex gap justify-end">
                    <button class="btn btn-ghost btn-sm" (click)="close()">Batal</button>
                    <button class="btn btn-primary btn-sm" (click)="save(c)" [disabled]="saving()">
                      @if (saving()) { <span class="spinner"></span> } @else { Simpan }
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        } @empty { <div class="card-pad text-muted">Belum ada konten.</div> }
      </div>
    } @else {
      <div class="flex justify-between items-center" style="margin-bottom:16px">
        <span class="text-muted">{{ members().length }} anggota struktur</span>
        @if (canUpdate) { <button class="btn btn-primary" (click)="openNew()">+ Tambah Anggota</button> }
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Nama</th><th>Jabatan</th><th>Tingkat</th><th>Urutan</th><th>Status</th><th></th></tr></thead>
            <tbody>
              @for (m of members(); track m.structureID) {
                <tr>
                  <td><strong>{{ m.memberName }}</strong></td>
                  <td class="text-muted">{{ m.position }}</td>
                  <td class="text-muted">{{ m.level }}</td>
                  <td class="text-muted">{{ m.sortOrder }}</td>
                  <td><span class="badge" [class.badge-active]="m.isActive" [class.badge-draft]="!m.isActive">{{ m.isActive ? 'Aktif' : 'Nonaktif' }}</span></td>
                  <td>
                    @if (canUpdate) {
                      <div class="table-actions">
                        <span class="link-action" (click)="openEdit(m)">Edit</span>
                        <span class="link-danger" (click)="removeOrg(m)">Hapus</span>
                      </div>
                    }
                  </td>
                </tr>
              } @empty { <tr><td colspan="6" class="text-muted">Belum ada anggota struktur.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    }

    @if (orgModal()) {
      <div class="modal-backdrop" (click)="closeOrg()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ orgEditId ? 'Ubah Anggota' : 'Tambah Anggota' }}</h3>
          <div class="form-group"><label class="form-label">Nama</label>
            <input class="form-control" [(ngModel)]="orgForm.memberName" placeholder="Nama lengkap"></div>
          <div class="form-group"><label class="form-label">Jabatan</label>
            <input class="form-control" [(ngModel)]="orgForm.position" placeholder="mis. Koordinator Puskomnas"></div>
          <div class="grid grid-2">
            <div class="form-group"><label class="form-label">Tingkat</label>
              <input class="form-control" [(ngModel)]="orgForm.level" placeholder="mis. Puskomnas"></div>
            <div class="form-group"><label class="form-label">Urutan</label>
              <input class="form-control" type="number" [(ngModel)]="orgForm.sortOrder"></div>
          </div>
          <div class="form-group"><label class="form-label">Foto (URL)</label>
            <input class="form-control" [(ngModel)]="orgForm.photoURL" placeholder="https://…"></div>
          <div class="form-group"><label class="form-label"><input type="checkbox" [(ngModel)]="orgForm.isActive"> Aktif ditampilkan</label></div>
          <div class="flex gap justify-between mt">
            <button class="btn btn-ghost" (click)="closeOrg()">Batal</button>
            <button class="btn btn-primary" (click)="saveOrg()" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> } @else { Simpan }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-head { margin-bottom: 20px; } .page-head h1 { margin-bottom: 2px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .tab { padding: 10px 18px; border-radius: 999px; font-weight: 600; font-size: .9rem; cursor: pointer; color: var(--color-text-secondary); background: #fff; border: 1px solid var(--color-border); }
    .tab.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .content-row { border-bottom: 1px solid var(--color-border); }
    .content-row:last-child { border-bottom: none; }
    .content-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; }
    .content-head code { display: block; color: var(--color-muted); font-size: .78rem; margin-bottom: 2px; }
    .chevron { transition: transform .15s; color: var(--color-muted); }
    .chevron.open { transform: rotate(180deg); }
    .content-edit { padding: 0 20px 20px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,26,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
    .modal { background: #fff; border-radius: var(--radius-lg); padding: 28px; width: 100%; max-width: 520px; max-height: 86vh; overflow: auto; }
  `],
})
export class CmsContentComponent implements OnInit {
  private contentSvc = inject(ContentService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  tab = signal<'content' | 'org'>('content');
  contents = signal<Content[]>([]);
  members = signal<OrgMember[]>([]);
  openKey = signal<number | null>(null);
  saving = signal(false);
  canUpdate = this.auth.hasPermission('content.update');

  draft = { contentTitle: '', contentBody: '' };
  orgModal = signal(false);
  orgEditId: number | null = null;
  orgForm: OrgForm = { ...EMPTY_ORG_FORM };

  ngOnInit(): void {
    this.loadContents();
    this.loadOrg();
  }

  loadContents(): void { this.contentSvc.list().subscribe({ next: (c) => this.contents.set(c), error: () => {} }); }
  loadOrg(): void { this.contentSvc.cmsOrg().subscribe({ next: (m) => this.members.set(m), error: () => {} }); }

  toggle(id: number): void {
    if (this.openKey() === id) { this.close(); return; }
    const c = this.contents().find((x) => x.contentID === id);
    if (!c) return;
    this.draft = { contentTitle: c.contentTitle ?? '', contentBody: c.contentBody ?? '' };
    this.openKey.set(id);
  }
  close(): void { this.openKey.set(null); }

  save(c: Content): void {
    this.saving.set(true);
    this.contentSvc.update(c.contentKey, this.draft).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Konten disimpan'); this.close(); this.loadContents(); },
      error: () => this.saving.set(false),
    });
  }

  openNew(): void { this.orgEditId = null; this.orgForm = { ...EMPTY_ORG_FORM, sortOrder: this.members().length + 1 }; this.orgModal.set(true); }
  openEdit(m: OrgMember): void {
    this.orgEditId = m.structureID;
    this.orgForm = { memberName: m.memberName, position: m.position, photoURL: m.photoURL ?? '', level: m.level ?? '', sortOrder: m.sortOrder ?? 0, isActive: m.isActive };
    this.orgModal.set(true);
  }
  closeOrg(): void { this.orgModal.set(false); }

  saveOrg(): void {
    if (!this.orgForm.memberName || !this.orgForm.position) { this.toast.error('Nama dan jabatan wajib diisi'); return; }
    this.saving.set(true);
    const body = { ...this.orgForm, sortOrder: +this.orgForm.sortOrder };
    const done = () => { this.saving.set(false); this.toast.success('Struktur organisasi disimpan'); this.closeOrg(); this.loadOrg(); };
    if (this.orgEditId) {
      this.contentSvc.updateOrg(this.orgEditId, body).subscribe({ next: done, error: () => this.saving.set(false) });
    } else {
      this.contentSvc.createOrg(body).subscribe({ next: done, error: () => this.saving.set(false) });
    }
  }

  removeOrg(m: OrgMember): void {
    if (!confirm(`Hapus "${m.memberName}" dari struktur organisasi?`)) return;
    this.contentSvc.removeOrg(m.structureID).subscribe({ next: () => { this.toast.success('Anggota dihapus'); this.loadOrg(); }, error: () => {} });
  }
}
