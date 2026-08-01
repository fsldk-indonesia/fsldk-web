import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ContentRepository } from '../../repositories/content.repository';
import { Content } from '../../entities/content';
import { OrgMember } from '../../entities/org-member';
import { ContentIndexView } from './content.index.view';

@Injectable()
export class ContentIndexPresenter extends BasePresenter<ContentIndexView> {
  private contentRepo = inject(ContentRepository);
  private toast = inject(ToastService);

  loadContents(): void {
    this.contentRepo.list().subscribe({ next: (c) => this.view.setContents(c), error: () => {} });
  }

  loadOrgMembers(): void {
    this.contentRepo.cmsOrgStructure().subscribe({ next: (m) => this.view.setMembers(m), error: () => {} });
  }

  saveContent(c: Content, draft: { contentTitle: string; contentBody: string }): void {
    this.view.setSaving(true);
    this.contentRepo.update(c.contentKey, draft).subscribe({
      next: () => { this.toast.success('Konten disimpan'); this.view.setSaving(false); this.view.onSaveContentSuccess(); },
      error: () => this.view.setSaving(false),
    });
  }

  saveOrgMember(editId: number | null, form: unknown): void {
    this.view.setSaving(true);
    const done = () => { this.toast.success('Struktur organisasi disimpan'); this.view.setSaving(false); this.view.onSaveOrgSuccess(); };
    if (editId) {
      this.contentRepo.updateOrg(editId, form).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.contentRepo.createOrg(form).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }

  removeOrgMember(member: OrgMember): void {
    this.contentRepo.removeOrg(member.structureID).subscribe({
      next: () => { this.toast.success('Anggota dihapus'); this.view.onRemoveOrgSuccess(); },
      error: () => {},
    });
  }
}
