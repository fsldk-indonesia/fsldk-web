import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { StructureRepository } from '../../repositories/structure.repository';
import { StructureFormView } from './structure.form.view';

export interface StructureFormValue {
  batch: string;
  period: string;
  structureName: string;
  structureDescription: string;
  logoImage: string;
  structureImage: string;
}

export const emptyStructureForm: StructureFormValue = {
  batch: '', period: '', structureName: '', structureDescription: '', logoImage: '', structureImage: '',
};

@Injectable()
export class StructureFormPresenter extends BasePresenter<StructureFormView> {
  private repo = inject(StructureRepository);
  private toast = inject(ToastService);

  loadForEdit(id: number): void {
    this.repo.cmsGet(id).subscribe({
      next: (s) => this.view.setForm({
        batch: s.batch, period: s.period, structureName: s.structureName,
        structureDescription: s.structureDescription,
        logoImage: s.logoImage ?? '', structureImage: s.structureImage ?? '',
      }),
      error: () => {},
    });
  }

  save(editId: number | null, form: StructureFormValue): void {
    if (!form.structureName.trim()) { this.toast.error('Nama kepengurusan wajib diisi'); return; }
    if (!form.batch.trim()) { this.toast.error('Angkatan wajib diisi'); return; }
    if (!form.period.trim()) { this.toast.error('Periode wajib diisi'); return; }
    if (!form.structureDescription.trim()) { this.toast.error('Deskripsi kepengurusan wajib diisi'); return; }
    if (!editId && (!form.logoImage || !form.structureImage)) {
      this.toast.error('Logo dan bagan struktur wajib diunggah');
      return;
    }

    this.view.setSaving(true);
    const done = () => { this.toast.success('Struktur disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.repo.update(editId, { ...form }).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.repo.create({ ...form }).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
