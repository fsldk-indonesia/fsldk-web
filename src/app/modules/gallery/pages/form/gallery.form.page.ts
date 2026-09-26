import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { AlertService } from '../../../../core/services/alert.service';
import { GalleryPhoto, CreatePhotoItemReq } from '../../entities/gallery';
import { GalleryFormPresenter, GalleryFormValue, emptyGalleryForm } from './gallery.form.presenter';
import { GalleryFormView } from './gallery.form.view';
import { GalleryLightboxComponent } from '../../components/gallery-lightbox/gallery-lightbox.component';

@Component({
  selector: 'app-gallery-form-page',
  standalone: true,
  templateUrl: './gallery.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent, ImageUploadComponent, RichTextEditorComponent, DateTimePickerComponent, ModalBackdropDirective, GalleryLightboxComponent],
  providers: [GalleryFormPresenter],
  styles: [`
    .page-head { margin: 0 0 24px; }
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }
    .form-control-lg { font-weight: 700; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }

    .add-photo-box { background: var(--color-bg-alt); border: 1px dashed var(--color-border); border-radius: var(--radius-md, 12px); padding: 18px; margin-bottom: 20px; }
    .photo-input-column { display: flex; flex-direction: column; justify-content: space-between; min-height: 100%; }
    .photo-btn-wrap { margin-top: 16px; padding-top: 6px; }

    .photo-tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .photo-tile { display: flex; gap: 12px; padding: 10px; background: #fff; border: 1px solid var(--color-border); border-radius: 10px; align-items: center; }
    .photo-tile-img { width: 64px; height: 64px; object-fit: cover; border-radius: 6px; border: 1px solid var(--color-border); flex-shrink: 0; cursor: zoom-in; }
    .photo-tile-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .photo-order-badge { font-size: 0.72rem; font-weight: 800; color: var(--color-primary); }
    .photo-caption-text { font-size: 0.82rem; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .photo-actions { display: flex; gap: 6px; margin-top: 2px; }
    .btn-icon-sm { background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 4px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); transition: all 0.2s; }
    .btn-icon-sm:hover:not(:disabled) { background: #fff; border-color: var(--color-primary); }
    .btn-icon-sm:disabled { opacity: 0.4; cursor: not-allowed; }

    .staged-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .staged-card { background: #fff; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
    .staged-img { width: 100%; height: 120px; object-fit: cover; }
    .staged-info { padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .staged-caption { font-size: 0.8rem; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

    @media (max-width: 768px) { .photo-tiles { grid-template-columns: 1fr; } .staged-grid { grid-template-columns: 1fr; } }

    .caption-modal-backdrop { position: fixed; inset: 0; background: rgba(11, 20, 15, 0.55); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; animation: caption-modal-fade-in 0.2s ease; }
    @keyframes caption-modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .caption-modal { background: var(--color-surface, #fff); border-radius: var(--radius-lg, 16px); padding: 24px 28px; width: 100%; max-width: 480px; box-shadow: var(--shadow-lg); }
    .caption-modal-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 1px solid var(--color-border); }
    .caption-modal-title { font-size: 1.1rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--color-text); }
    .btn-close { background: transparent; border: none; cursor: pointer; color: var(--color-text-secondary); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
    .btn-close:hover { background: var(--color-bg-alt); color: var(--color-text); }
    .caption-preview-box { display: flex; gap: 14px; align-items: center; background: var(--color-bg-alt); padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .caption-preview-thumb { width: 64px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--color-border); flex-shrink: 0; }
    .caption-preview-hint { font-size: 0.8rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4; }
    .caption-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 18px; margin-top: 20px; border-top: 1px solid var(--color-border); }
  `],
})
export class GalleryFormPage implements OnInit, GalleryFormView {
  private presenter = inject(GalleryFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alert = inject(AlertService);

  editId: number | null = null;
  isReadonly = false;
  loading = signal(false);
  saving = signal(false);
  photosLoading = signal(false);
  addingPhoto = signal(false);
  savingCaption = signal(false);

  form: GalleryFormValue = { ...emptyGalleryForm };

  existingPhotos = signal<GalleryPhoto[]>([]);
  stagedPhotos = signal<CreatePhotoItemReq[]>([]);
  newPhotoPath = signal<string | null>(null);
  newPhotoCaption = '';

  editingCaptionPhoto = signal<GalleryPhoto | null>(null);
  editingCaptionText = signal('');

  lightboxOpen = signal(false);
  lightboxIndex = signal(0);

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap galeri ini.';
    return this.editId ? 'Perbarui informasi galeri yang sudah ada.' : 'Dokumentasikan kegiatan baru beserta foto-fotonya.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);

    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
      this.presenter.loadPhotos(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form, this.stagedPhotos()); }

  // Create mode: stage a photo locally, sent together on Create
  addStagedPhoto(): void {
    const path = this.newPhotoPath();
    if (!path) return;
    this.stagedPhotos.set([...this.stagedPhotos(), {
      imagePath: path,
      caption: this.newPhotoCaption.trim() || null,
      sortOrder: this.stagedPhotos().length,
    }]);
    this.newPhotoPath.set(null);
    this.newPhotoCaption = '';
  }

  removeStagedPhoto(index: number): void {
    this.stagedPhotos.set(this.stagedPhotos().filter((_, i) => i !== index));
  }

  // Edit mode: photo persisted immediately via its own sub-endpoint
  onAddPhotoCMS(): void {
    const path = this.newPhotoPath();
    if (!path || !this.editId) return;
    this.presenter.addPhoto(this.editId, {
      imagePath: path,
      caption: this.newPhotoCaption.trim() || null,
      sortOrder: this.existingPhotos().length,
    });
  }

  openEditCaptionModal(photo: GalleryPhoto): void {
    this.editingCaptionPhoto.set(photo);
    this.editingCaptionText.set(photo.caption || '');
  }

  closeCaptionModal(): void {
    if (this.savingCaption()) return;
    this.editingCaptionPhoto.set(null);
    this.editingCaptionText.set('');
  }

  savePhotoCaption(): void {
    const photo = this.editingCaptionPhoto();
    if (!photo || !this.editId) return;
    this.presenter.updatePhotoCaption(this.editId, photo.photoID, this.editingCaptionText().trim() || null);
  }

  async deletePhotoCMS(photoID: number, event?: MouseEvent): Promise<void> {
    const ok = await this.alert.confirm('Hapus foto ini dari galeri? File foto akan dihapus secara permanen.', {
      title: 'Hapus Foto Dokumentasi', confirmLabel: 'Ya, Hapus Foto', variant: 'danger',
    }, event);
    if (!ok || !this.editId) return;
    this.presenter.deletePhoto(this.editId, photoID);
  }

  movePhoto(index: number, direction: -1 | 1): void {
    const photos = [...this.existingPhotos()];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    [photos[index], photos[targetIdx]] = [photos[targetIdx], photos[index]];
    this.existingPhotos.set(photos);
    if (this.editId) this.presenter.reorderPhotos(this.editId, photos.map((p) => p.photoID));
  }

  // GalleryFormView
  setLoading(loading: boolean): void { this.loading.set(loading); }
  setForm(form: GalleryFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  setPhotosLoading(loading: boolean): void { this.photosLoading.set(loading); }
  setExistingPhotos(photos: GalleryPhoto[]): void { this.existingPhotos.set(photos); }
  setAddingPhoto(adding: boolean): void { this.addingPhoto.set(adding); }
  setSavingCaption(saving: boolean): void { this.savingCaption.set(saving); }
  onPhotoAdded(): void { this.newPhotoPath.set(null); this.newPhotoCaption = ''; }
  onPhotoCaptionSaved(): void { this.editingCaptionPhoto.set(null); this.editingCaptionText.set(''); }
  navigateToIndex(): void { this.router.navigate(['/cms/galleries']); }
}
