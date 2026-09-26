import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GalleryRepository } from '../../repositories/gallery.repository';
import { AddPhotoReq, CreatePhotoItemReq } from '../../entities/gallery';
import { GalleryFormView } from './gallery.form.view';

export interface GalleryFormValue {
  eventName: string;
  eventTheme: string;
  eventDate: string;
  youtubeVideoID: string;
  documentLink: string;
  coverImage: string;
  eventDescription: string;
}

export const emptyGalleryForm: GalleryFormValue = {
  eventName: '', eventTheme: '', eventDate: '', youtubeVideoID: '',
  documentLink: '', coverImage: '', eventDescription: '',
};

@Injectable()
export class GalleryFormPresenter extends BasePresenter<GalleryFormView> {
  private galleryRepo = inject(GalleryRepository);
  private toast = inject(ToastService);

  loadForEdit(id: number): void {
    this.view.setLoading(true);
    this.galleryRepo.cmsGet(id).subscribe({
      next: (item) => {
        this.view.setForm({
          eventName: item.eventName,
          eventTheme: item.eventTheme,
          eventDate: item.eventDate ? item.eventDate.substring(0, 10) : '',
          youtubeVideoID: item.youtubeVideoID || '',
          documentLink: item.documentLink || '',
          coverImage: item.coverImage,
          eventDescription: item.eventDescription,
        });
        this.view.setLoading(false);
      },
      error: () => {
        this.toast.error('Gagal memuat galeri');
        this.view.navigateToIndex();
      },
    });
  }

  loadPhotos(galleryID: number): void {
    this.view.setPhotosLoading(true);
    this.galleryRepo.loadPhotosCMS(galleryID, 1, 100).subscribe({
      next: (res) => { this.view.setExistingPhotos(res.data || []); this.view.setPhotosLoading(false); },
      error: () => this.view.setPhotosLoading(false),
    });
  }

  addPhoto(galleryID: number, req: AddPhotoReq): void {
    this.view.setAddingPhoto(true);
    this.galleryRepo.addPhoto(galleryID, req).subscribe({
      next: () => { this.toast.success('Foto berhasil ditambahkan'); this.view.setAddingPhoto(false); this.view.onPhotoAdded(); this.loadPhotos(galleryID); },
      error: (err) => { this.toast.error(err.error?.message || 'Gagal menambahkan foto'); this.view.setAddingPhoto(false); },
    });
  }

  updatePhotoCaption(galleryID: number, photoID: number, caption: string | null): void {
    this.view.setSavingCaption(true);
    this.galleryRepo.updatePhoto(galleryID, photoID, { caption }).subscribe({
      next: () => { this.toast.success('Caption berhasil diperbarui'); this.view.setSavingCaption(false); this.view.onPhotoCaptionSaved(); this.loadPhotos(galleryID); },
      error: (err) => { this.toast.error(err.error?.message || 'Gagal memperbarui caption'); this.view.setSavingCaption(false); },
    });
  }

  deletePhoto(galleryID: number, photoID: number): void {
    this.galleryRepo.deletePhoto(galleryID, photoID).subscribe({
      next: () => { this.toast.success('Foto berhasil dihapus'); this.loadPhotos(galleryID); },
      error: (err) => this.toast.error(err.error?.message || 'Gagal menghapus foto'),
    });
  }

  reorderPhotos(galleryID: number, order: number[]): void {
    this.galleryRepo.reorderPhotos(galleryID, { order }).subscribe({
      next: () => this.toast.success('Urutan foto berhasil diperbarui'),
      error: () => { this.toast.error('Gagal memperbarui urutan foto'); this.loadPhotos(galleryID); },
    });
  }

  save(editId: number | null, form: GalleryFormValue, stagedPhotos: CreatePhotoItemReq[]): void {
    if (!form.eventName.trim() || !form.eventTheme.trim() || !form.eventDescription.trim() || !form.coverImage) {
      this.toast.error('Nama kegiatan, tema, deskripsi, dan foto sampul wajib diisi');
      return;
    }

    this.view.setSaving(true);
    const payload = {
      eventName: form.eventName,
      eventTheme: form.eventTheme,
      eventDate: form.eventDate || null,
      eventDescription: form.eventDescription,
      coverImage: form.coverImage,
      youtubeVideoID: form.youtubeVideoID || null,
      documentLink: form.documentLink || null,
    };

    if (editId) {
      this.galleryRepo.update(editId, payload).subscribe({
        next: () => { this.toast.success('Metadata galeri berhasil disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); },
        error: (err) => { this.toast.error('Gagal mengupdate galeri: ' + (err.error?.message || 'Unknown error')); this.view.setSaving(false); },
      });
    } else {
      this.galleryRepo.create({ ...payload, photos: stagedPhotos }).subscribe({
        next: () => { this.toast.success('Galeri berhasil dibuat'); this.view.setSaving(false); this.view.navigateToIndex(); },
        error: (err) => { this.toast.error('Gagal membuat galeri: ' + (err.error?.message || 'Unknown error')); this.view.setSaving(false); },
      });
    }
  }
}
