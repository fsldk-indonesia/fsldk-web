import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SubmissionFormRepository } from '../../repositories/submission-form.repository';
import { SubmissionFormBuilderView } from './submission-form.builder.view';

@Injectable()
export class SubmissionFormBuilderPresenter extends BasePresenter<SubmissionFormBuilderView> {
  private repo = inject(SubmissionFormRepository);
  private toast = inject(ToastService);

  loadForm(formID: number): void {
    this.repo.getForm(formID).subscribe({ next: (f) => this.view.setForm(f), error: () => {} });
  }

  loadVersion(versionID: number): void {
    this.repo.getVersion(versionID).subscribe({ next: (v) => this.view.setVersion(v), error: () => {} });
  }

  createVersion(formID: number, cloneFromVersionID: number | null, onDone: (versionID: number) => void): void {
    this.view.setBusy(true);
    this.repo.createVersion(formID, cloneFromVersionID).subscribe({
      next: (v) => { this.view.setBusy(false); this.toast.success('Versi baru dibuat'); this.view.reload(); onDone(v.versionID); },
      error: () => this.view.setBusy(false),
    });
  }

  publishVersion(versionID: number, formID: number): void {
    this.view.setBusy(true);
    this.repo.publishVersion(versionID).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Versi dipublikasikan'); this.view.reload(); this.loadForm(formID); },
      error: () => this.view.setBusy(false),
    });
  }

  saveSection(versionID: number, sectionID: number | null, body: unknown): void {
    this.view.setBusy(true);
    const req = sectionID ? this.repo.updateSection(sectionID, body) : this.repo.createSection(versionID, body);
    req.subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Section disimpan'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }

  removeSection(sectionID: number): void {
    this.repo.deleteSection(sectionID).subscribe({
      next: () => { this.toast.success('Section dihapus'); this.view.reload(); },
      error: () => {},
    });
  }

  saveField(sectionID: number, fieldID: number | null, body: unknown): void {
    this.view.setBusy(true);
    const req = fieldID ? this.repo.updateField(fieldID, body) : this.repo.createField(sectionID, body);
    req.subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Field disimpan'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }

  removeField(fieldID: number): void {
    this.repo.deleteField(fieldID).subscribe({
      next: () => { this.toast.success('Field dihapus'); this.view.reload(); },
      error: () => {},
    });
  }

  saveOption(fieldID: number, optionID: number | null, body: unknown): void {
    this.view.setBusy(true);
    const req = optionID ? this.repo.updateOption(optionID, body) : this.repo.createOption(fieldID, body);
    req.subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Pilihan disimpan'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }

  removeOption(optionID: number): void {
    this.repo.deleteOption(optionID).subscribe({
      next: () => { this.toast.success('Pilihan dihapus'); this.view.reload(); },
      error: () => {},
    });
  }
}
