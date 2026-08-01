import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { Content } from '../../entities/content';
import { OrgMember } from '../../entities/org-member';
import { ContentIndexPresenter } from './content.index.presenter';
import { ContentIndexView } from './content.index.view';

type OrgForm = { memberName: string; position: string; photoURL: string; level: string; sortOrder: number; isActive: boolean };
const EMPTY_ORG_FORM: OrgForm = { memberName: '', position: '', photoURL: '', level: '', sortOrder: 0, isActive: true };

@Component({
  selector: 'app-content-index-page',
  standalone: true,
  templateUrl: './content.index.page.html',
  imports: [FormsModule],
  providers: [ContentIndexPresenter],
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
export class ContentIndexPage implements OnInit, ContentIndexView {
  private presenter = inject(ContentIndexPresenter);
  private auth = inject(AuthRepository);

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
    this.presenter.attachView(this);
    this.presenter.loadContents();
    this.presenter.loadOrgMembers();
  }

  toggle(id: number): void {
    if (this.openKey() === id) { this.close(); return; }
    const c = this.contents().find((x) => x.contentID === id);
    if (!c) return;
    this.draft = { contentTitle: c.contentTitle ?? '', contentBody: c.contentBody ?? '' };
    this.openKey.set(id);
  }
  close(): void { this.openKey.set(null); }
  save(c: Content): void { this.presenter.saveContent(c, this.draft); }

  openNew(): void { this.orgEditId = null; this.orgForm = { ...EMPTY_ORG_FORM, sortOrder: this.members().length + 1 }; this.orgModal.set(true); }
  openEdit(m: OrgMember): void {
    this.orgEditId = m.structureID;
    this.orgForm = { memberName: m.memberName, position: m.position, photoURL: m.photoURL ?? '', level: m.level ?? '', sortOrder: m.sortOrder ?? 0, isActive: m.isActive };
    this.orgModal.set(true);
  }
  closeOrg(): void { this.orgModal.set(false); }

  saveOrg(): void {
    const body = { ...this.orgForm, sortOrder: +this.orgForm.sortOrder };
    this.presenter.saveOrgMember(this.orgEditId, body);
  }

  removeOrg(m: OrgMember): void {
    if (!confirm(`Hapus "${m.memberName}" dari struktur organisasi?`)) return;
    this.presenter.removeOrgMember(m);
  }

  setContents(contents: Content[]): void { this.contents.set(contents); }
  setMembers(members: OrgMember[]): void { this.members.set(members); }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  onSaveContentSuccess(): void { this.close(); this.presenter.loadContents(); }
  onSaveOrgSuccess(): void { this.closeOrg(); this.presenter.loadOrgMembers(); }
  onRemoveOrgSuccess(): void { this.presenter.loadOrgMembers(); }
}
