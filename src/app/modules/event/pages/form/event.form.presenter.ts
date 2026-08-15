import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { EventRepository } from '../../repositories/event.repository';
import { EventFormView } from './event.form.view';

export interface EventFormValue {
  eventTitle: string;
  eventDivision: string;
  eventContent: string;
  eventImage: string;
  startDate: string;
  endDate: string;
  closeRegistDate: string;
  location: string;
  place: string;
  locationLink: string;
  registrationLink: string;
  documentLink: string;
  presentationLink: string;
  contactPerson1: string;
  nameCp1: string;
  contactPerson2: string;
  nameCp2: string;
  tag: string;
  isPublished: boolean;
}

export const emptyEventForm: EventFormValue = {
  eventTitle: '', eventDivision: '', eventContent: '', eventImage: '',
  startDate: '', endDate: '', closeRegistDate: '',
  location: '', place: '', locationLink: '', registrationLink: '',
  documentLink: '', presentationLink: '',
  contactPerson1: '', nameCp1: '', contactPerson2: '', nameCp2: '',
  tag: '', isPublished: false,
};

@Injectable()
export class EventFormPresenter extends BasePresenter<EventFormView> {
  private eventRepo = inject(EventRepository);
  private toast = inject(ToastService);

  loadForEdit(id: number): void {
    this.eventRepo.cmsGet(id).subscribe({
      next: (e) => {
        this.view.setForm({
          eventTitle: e.eventTitle, eventDivision: e.eventDivision,
          eventContent: e.eventContent, eventImage: e.eventImage ?? '',
          startDate: e.startDate ? e.startDate.substring(0, 16) : '',
          endDate: e.endDate ? e.endDate.substring(0, 16) : '',
          closeRegistDate: e.closeRegistDate ? e.closeRegistDate.substring(0, 16) : '',
          location: e.location ?? '', place: e.place ?? '',
          locationLink: e.locationLink ?? '', registrationLink: e.registrationLink ?? '',
          documentLink: e.documentLink ?? '', presentationLink: e.presentationLink ?? '',
          contactPerson1: e.contactPerson1 ?? '', nameCp1: e.nameCp1 ?? '',
          contactPerson2: e.contactPerson2 ?? '', nameCp2: e.nameCp2 ?? '',
          tag: e.tag ?? '', isPublished: e.isPublished,
        });
      },
      error: () => {},
    });
  }

  save(editId: number | null, form: EventFormValue): void {
    if (!form.eventTitle.trim()) { this.toast.error('Judul event wajib diisi'); return; }
    if (!form.eventDivision.trim()) { this.toast.error('Divisi penyelenggara wajib diisi'); return; }
    if (!form.eventContent.trim()) { this.toast.error('Deskripsi event wajib diisi'); return; }

    this.view.setSaving(true);
    const body = { ...form };

    const done = () => {
      this.toast.success('Event disimpan');
      this.view.setSaving(false);
      this.view.navigateToIndex();
    };

    if (editId) {
      this.eventRepo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.eventRepo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
