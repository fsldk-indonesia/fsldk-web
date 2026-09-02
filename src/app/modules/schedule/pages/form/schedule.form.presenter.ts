import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { SCHEDULE_CATEGORIES } from '../../schedule.constants';
import { ScheduleFormView } from './schedule.form.view';

export interface ScheduleFormValue {
  title: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  contactPerson: string;
  url: string;
}

export const emptyScheduleForm: ScheduleFormValue = {
  title: '', category: 'lainnya', description: '', startDate: '', endDate: '',
  isAllDay: false, startTime: '', endTime: '', location: '', organizer: '',
  contactPerson: '', url: '',
};

@Injectable()
export class ScheduleFormPresenter extends BasePresenter<ScheduleFormView> {
  private repo = inject(ScheduleRepository);
  private toast = inject(ToastService);

  loadForEdit(id: number): void {
    this.repo.cmsGet(id).subscribe({
      next: (s) => this.view.setForm({
        title: s.title,
        category: s.category,
        description: s.description ?? '',
        startDate: s.startDate,
        endDate: s.endDate ?? '',
        isAllDay: s.isAllDay,
        startTime: s.startTime ?? '',
        endTime: s.endTime ?? '',
        location: s.location ?? '',
        organizer: s.organizer ?? '',
        contactPerson: s.contactPerson ?? '',
        url: s.url ?? '',
      }),
      error: () => {},
    });
  }

  /** Mirror of the backend cross-field rules (tech spec §4.3) for instant feedback. */
  validate(f: ScheduleFormValue): string[] {
    const errs: string[] = [];
    const title = f.title.trim();
    if (title.length < 3) errs.push('Judul kegiatan wajib diisi (minimal 3 karakter).');
    if (title.length > 150) errs.push('Judul kegiatan maksimal 150 karakter.');
    if (!SCHEDULE_CATEGORIES.some((c) => c.value === f.category)) errs.push('Kategori tidak valid.');
    if (!f.startDate) errs.push('Tanggal mulai wajib diisi.');
    if (f.endDate && f.startDate && f.endDate < f.startDate) errs.push('Tanggal selesai tidak boleh sebelum tanggal mulai.');
    if (!f.isAllDay) {
      if (!f.startTime) errs.push('Jam mulai wajib diisi untuk kegiatan yang tidak sepanjang hari.');
      const singleDay = !f.endDate || f.endDate === f.startDate;
      if (f.startTime && f.endTime && singleDay && f.endTime <= f.startTime) {
        errs.push('Jam selesai harus setelah jam mulai.');
      }
    }
    if (f.url && !/^https?:\/\//i.test(f.url.trim())) errs.push('Tautan harus diawali http:// atau https://.');
    return errs;
  }

  save(editId: number | null, form: ScheduleFormValue): void {
    const errs = this.validate(form);
    if (errs.length) { this.toast.error(errs[0]); return; }

    this.view.setSaving(true);
    const body = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      startDate: form.startDate,
      endDate: form.endDate || '',
      isAllDay: form.isAllDay,
      startTime: form.isAllDay ? '' : form.startTime,
      endTime: form.isAllDay ? '' : form.endTime,
      location: form.location.trim(),
      organizer: form.organizer.trim(),
      contactPerson: form.contactPerson.trim(),
      url: form.url.trim(),
    };

    const done = () => { this.toast.success('Jadwal disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.repo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.repo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
