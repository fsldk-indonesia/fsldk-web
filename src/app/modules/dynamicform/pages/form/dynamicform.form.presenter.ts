import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormFormView } from './dynamicform.form.view';

export interface CollaboratorRow {
  userID: number;
  role: 'editor' | 'manager';
}

export interface DynamicFormFormValue {
  title: string;
  description: string;
  requireLogin: boolean;
  isMultipleSubmit: boolean;
  maxSubmission: number | null;
  startDate: string;
  endDate: string;
  confirmationMessage: string;
  redirectUrl: string;
  sendConfirmationEmail: boolean;
  notifyEmails: string;
  rateLimitPerIP: number;
  rateLimitWindowMinutes: number;
  gsheetEnabled: boolean;
  collaborators: CollaboratorRow[];
}

export const emptyDynamicFormForm: DynamicFormFormValue = {
  title: '', description: '', requireLogin: false, isMultipleSubmit: false, maxSubmission: null,
  startDate: '', endDate: '', confirmationMessage: '', redirectUrl: '',
  sendConfirmationEmail: true, notifyEmails: '', rateLimitPerIP: 5, rateLimitWindowMinutes: 10,
  gsheetEnabled: false, collaborators: [],
};

@Injectable()
export class DynamicFormFormPresenter extends BasePresenter<DynamicFormFormView> {
  private repo = inject(DynamicFormRepository);
  private toast = inject(ToastService);

  loadForEdit(id: number): void {
    this.repo.cmsGet(id).subscribe({
      next: (f) => {
        this.view.setForm(this.toFormValue(f));
        this.view.setGsheetStatus({
          enabled: f.gsheetEnabled, spreadsheetUrl: f.gsheetSpreadsheetUrl ?? '',
          lastSyncDate: f.gsheetLastSyncDate ?? '', lastSyncError: f.gsheetLastSyncError ?? '',
        });
      },
      error: () => {},
    });
  }

  private toFormValue(f: DynamicForm): DynamicFormFormValue {
    return {
      title: f.title, description: f.description ?? '', requireLogin: f.requireLogin,
      isMultipleSubmit: f.isMultipleSubmit, maxSubmission: f.maxSubmission,
      startDate: (f.startDate ?? '').replace(' ', 'T').slice(0, 16),
      endDate: (f.endDate ?? '').replace(' ', 'T').slice(0, 16),
      confirmationMessage: f.confirmationMessage ?? '', redirectUrl: f.redirectUrl ?? '',
      sendConfirmationEmail: f.sendConfirmationEmail, notifyEmails: (f.notifyEmails ?? []).join(', '),
      rateLimitPerIP: f.rateLimitPerIP || 5, rateLimitWindowMinutes: f.rateLimitWindowMinutes || 10,
      gsheetEnabled: f.gsheetEnabled,
      collaborators: (f.collaborators ?? []).map((c) => ({ userID: c.userID, role: c.role })),
    };
  }

  private toBody(form: DynamicFormFormValue): Record<string, unknown> {
    const dt = (v: string) => (v ? v.replace('T', ' ') + (v.length === 16 ? ':00' : '') : null);
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      requireLogin: form.requireLogin,
      isMultipleSubmit: form.isMultipleSubmit,
      maxSubmission: form.maxSubmission ? Number(form.maxSubmission) : null,
      startDate: dt(form.startDate),
      endDate: dt(form.endDate),
      confirmationMessage: form.confirmationMessage.trim() || null,
      redirectUrl: form.redirectUrl.trim() || null,
      sendConfirmationEmail: form.sendConfirmationEmail,
      notifyEmails: form.notifyEmails.split(',').map((s) => s.trim()).filter(Boolean),
      rateLimitPerIP: Number(form.rateLimitPerIP) || 5,
      rateLimitWindowMinutes: Number(form.rateLimitWindowMinutes) || 10,
      gsheetEnabled: form.gsheetEnabled,
      collaborators: form.collaborators
        .filter((c) => c.userID)
        .map((c) => ({ userID: Number(c.userID), role: c.role })),
    };
  }

  save(editId: number | null, form: DynamicFormFormValue): void {
    if (form.title.trim().length < 3) {
      this.toast.error('Judul formulir minimal 3 karakter');
      return;
    }
    this.view.setSaving(true);
    const body = this.toBody(form);
    if (editId) {
      this.repo.update(editId, body).subscribe({
        next: () => { this.toast.success('Formulir diperbarui'); this.view.setSaving(false); this.view.navigateToIndex(); },
        error: () => this.view.setSaving(false),
      });
    } else {
      this.repo.create(body).subscribe({
        next: (f) => { this.toast.success('Formulir dibuat'); this.view.setSaving(false); this.view.navigateToBuilder(f.formID); },
        error: () => this.view.setSaving(false),
      });
    }
  }

  gsheetConnect(id: number): void {
    this.repo.gsheetConnect(id).subscribe({
      next: (s) => { this.toast.success('Google Sheet terhubung'); this.view.setGsheetStatus(s); },
      error: () => {},
    });
  }
  gsheetResync(id: number): void {
    this.repo.gsheetResync(id).subscribe({
      next: (s) => { this.toast.success('Sinkronisasi ulang dijadwalkan'); this.view.setGsheetStatus(s); },
      error: () => {},
    });
  }
  gsheetDisconnect(id: number): void {
    this.repo.gsheetDisconnect(id).subscribe({
      next: (s) => { this.toast.success('Google Sheet diputuskan (spreadsheet tidak dihapus)'); this.view.setGsheetStatus(s); },
      error: () => {},
    });
  }
}
