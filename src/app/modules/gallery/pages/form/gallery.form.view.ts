import { GalleryPhoto } from '../../entities/gallery';
import { GalleryFormValue } from './gallery.form.presenter';

export interface GalleryFormView {
  setLoading(loading: boolean): void;
  setForm(form: GalleryFormValue): void;
  setSaving(saving: boolean): void;
  setPhotosLoading(loading: boolean): void;
  setExistingPhotos(photos: GalleryPhoto[]): void;
  setAddingPhoto(adding: boolean): void;
  setSavingCaption(saving: boolean): void;
  /** Reset input "Tambah Foto" (path + caption) setelah berhasil ditambahkan. */
  onPhotoAdded(): void;
  /** Tutup modal ubah caption setelah berhasil disimpan. */
  onPhotoCaptionSaved(): void;
  navigateToIndex(): void;
}
