import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { catchError, EMPTY } from 'rxjs';

import { GalleryRepository } from '../../repositories/gallery.repository';
import { GalleryPhoto, CreatePhotoItemReq } from '../../entities/gallery';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';

/**
 * CMS form component for creating and editing galleries, with embedded photo management.
 */
@Component({
  selector: 'app-gallery-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IconComponent,
    ImageUploadComponent,
    RichTextEditorComponent,
    DateTimePickerComponent,
  ],
  template: `
    <div class="cms-header">
      <div class="cms-header-content">
        <button type="button" class="btn btn-sm btn-icon btn-outline mr-md" (click)="back()">
          <app-icon name="arrow-left" [size]="16" />
        </button>
        <div>
          <h1 class="cms-title">{{ isEdit() ? 'Edit Galeri' : 'Tambah Galeri' }}</h1>
          <p class="cms-subtitle">
            {{ isEdit() ? 'Perbarui informasi kegiatan dan kelola foto dokumentasi.' : 'Tambahkan galeri kegiatan baru beserta dokumentasi fotonya.' }}
          </p>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="cms-card py-xl text-center">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat data galeri...</p>
      </div>
    } @else {
      <div class="form-grid-layout">
        <!-- Main Metadata Form -->
        <div class="cms-card">
          <h2 class="section-title"><app-icon name="info-circle" [size]="18" /> Metadata Kegiatan</h2>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-md">
            
            <div class="form-group row">
              <div class="col-md-6">
                <label class="form-label" for="eventName">Nama Kegiatan / Event <span class="text-danger">*</span></label>
                <input
                  type="text"
                  id="eventName"
                  class="form-control"
                  formControlName="eventName"
                  placeholder="Cth: Rakornas FSLDK Indonesia 2026"
                />
                @if (f['eventName'].invalid && (f['eventName'].dirty || f['eventName'].touched || submitTried())) {
                  <div class="form-error">Nama kegiatan wajib diisi (maks 255 karakter).</div>
                }
              </div>

              <div class="col-md-6">
                <label class="form-label" for="eventTheme">Tema / Tagline Kegiatan <span class="text-danger">*</span></label>
                <input
                  type="text"
                  id="eventTheme"
                  class="form-control"
                  formControlName="eventTheme"
                  placeholder="Cth: Bersatu dalam Dakwah Membangun Peradaban"
                />
                @if (f['eventTheme'].invalid && (f['eventTheme'].dirty || f['eventTheme'].touched || submitTried())) {
                  <div class="form-error">Tema kegiatan wajib diisi (maks 255 karakter).</div>
                }
              </div>
            </div>

            <!-- Event Date (Date Picker) -->
            <div class="form-group">
              <label class="form-label" for="eventDate">Tanggal Pelaksanaan Kegiatan</label>
              <app-datetime-picker
                formControlName="eventDate"
                [showTime]="false"
                placeholder="Pilih tanggal kegiatan..."
              />
              <p class="form-text mt-xs text-muted">Tanggal saat kegiatan diselenggarakan (bisa tanggal lampau atau terkini).</p>
            </div>

            <!-- Cover Image Upload -->
            <div class="form-group">
              <label class="form-label">Foto Sampul (Cover) <span class="text-danger">*</span></label>
              <app-image-upload
                [value]="coverImagePath() || ''"
                (valueChange)="coverImagePath.set($event)"
              />
              <p class="form-text mt-xs text-muted">Format JPG/PNG/WebP, rasio 16:10 atau 4:3 direkomendasikan.</p>
              @if (submitTried() && !coverImagePath()) {
                <div class="form-error">Foto sampul wajib diunggah.</div>
              }
            </div>

            <div class="form-group row">
              <div class="col-md-6">
                <label class="form-label" for="youtubeVideoID">Tautan / ID Video YouTube (Opsional)</label>
                <input
                  type="text"
                  id="youtubeVideoID"
                  class="form-control"
                  formControlName="youtubeVideoID"
                  placeholder="Cth: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                />
                <p class="form-text mt-xs text-muted">Bisa berupa link YouTube lengkap atau video ID.</p>
              </div>

              <div class="col-md-6">
                <label class="form-label" for="documentLink">Tautan Dokumentasi Lengkap (Opsional)</label>
                <input
                  type="url"
                  id="documentLink"
                  class="form-control"
                  formControlName="documentLink"
                  placeholder="Cth: https://drive.google.com/drive/folders/..."
                />
                <p class="form-text mt-xs text-muted">Link folder Google Drive / Cloud Storage untuk arsip resolusi penuh.</p>
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">Deskripsi Lengkap Kegiatan <span class="text-danger">*</span></label>
              <app-rich-text-editor
                [value]="form.value.eventDescription || ''"
                (valueChange)="onDescriptionChange($event)"
              />
              @if (submitTried() && (!form.value.eventDescription || !form.value.eventDescription.trim())) {
                <div class="form-error">Deskripsi kegiatan wajib diisi.</div>
              }
            </div>

            <div class="form-actions mt-lg">
              <button type="button" class="btn btn-outline" (click)="back()" [disabled]="submitting()">
                Batal
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { <div class="spinner spinner-sm mr-xs"></div> }
                {{ isEdit() ? 'Simpan Perubahan Metadata' : 'Buat Galeri' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Photos Section -->
        <div class="cms-card">
          <div class="flex justify-between items-center pb-sm border-b">
            <h2 class="section-title m-0">
              <app-icon name="images" [size]="18" />
              {{ isEdit() ? 'Kelola Foto Tambahan (' + existingPhotos().length + ' Foto)' : 'Foto Tambahan Awal' }}
            </h2>
          </div>

          <!-- If in Edit Mode: Interactive CRUD for Photos -->
          @if (isEdit()) {
            <!-- Add New Photo Box -->
            <div class="add-photo-box mt-md p-md">
              <h3 class="text-sm font-bold mb-xs">Tambah Satu Foto ke Galeri</h3>
              <div class="row">
                <div class="col-md-6">
                  <app-image-upload
                    [value]="newPhotoPath() || ''"
                    (valueChange)="newPhotoPath.set($event)"
                  />
                </div>
                <div class="col-md-6 flex flex-col justify-between">
                  <div>
                    <label class="form-label text-sm" for="newCaption">Keterangan / Caption (Opsional)</label>
                    <input
                      type="text"
                      id="newCaption"
                      class="form-control"
                      placeholder="Cth: Sesi foto bersama pengurus"
                      [(ngModel)]="newPhotoCaption"
                    />
                  </div>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm mt-sm self-start"
                    [disabled]="!newPhotoPath() || addingPhoto()"
                    (click)="onAddPhotoCMS()"
                  >
                    @if (addingPhoto()) { <div class="spinner spinner-sm mr-xs"></div> }
                    + Simpan Foto Baru
                  </button>
                </div>
              </div>
            </div>

            <!-- Existing Photos List -->
            <div class="photo-items-list mt-md">
              @if (photosLoading()) {
                <div class="text-center py-md text-muted">
                  <div class="spinner"></div> Memuat daftar foto...
                </div>
              } @else if (existingPhotos().length === 0) {
                <p class="text-muted text-center py-md">Belum ada foto tambahan pada galeri ini.</p>
              } @else {
                <div class="photo-tiles">
                  @for (photo of existingPhotos(); track photo.photoID; let i = $index) {
                    <div class="photo-tile">
                      <img [src]="imgUrl(photo.imagePath)" [alt]="photo.caption || 'Foto ' + (i + 1)" class="photo-tile-img" />
                      <div class="photo-tile-content">
                        <span class="photo-order-badge">#{{ i + 1 }}</span>
                        <div class="photo-caption-text">
                          {{ photo.caption || '(Tanpa keterangan)' }}
                        </div>
                        <div class="photo-actions">
                          <button
                            type="button"
                            class="btn-icon-sm"
                            title="Pindah ke Atas / Kiri"
                            [disabled]="i === 0"
                            (click)="movePhoto(i, -1)"
                          >
                            <app-icon name="arrow-up" [size]="12" />
                          </button>
                          <button
                            type="button"
                            class="btn-icon-sm"
                            title="Pindah ke Bawah / Kanan"
                            [disabled]="i === existingPhotos().length - 1"
                            (click)="movePhoto(i, 1)"
                          >
                            <app-icon name="arrow-down" [size]="12" />
                          </button>
                          <button
                            type="button"
                            class="btn-icon-sm text-primary"
                            title="Edit Caption"
                            (click)="editPhotoCaption(photo)"
                          >
                            <app-icon name="edit" [size]="12" />
                          </button>
                          <button
                            type="button"
                            class="btn-icon-sm text-danger"
                            title="Hapus Foto"
                            (click)="deletePhotoCMS(photo.photoID)"
                          >
                            <app-icon name="trash" [size]="12" />
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <!-- In Create Mode: Staging Initial Photos -->
            <div class="mt-md">
              <p class="text-muted text-sm mb-md">
                Anda dapat menambahkan beberapa foto sekarang atau menyimpannya terlebih dahulu lalu mengelolanya nanti.
              </p>

              <!-- Upload photo to stage -->
              <div class="add-photo-box p-md mb-md">
                <div class="row">
                  <div class="col-md-6">
                    <label class="form-label text-sm">Unggah Foto</label>
                    <app-image-upload
                      [value]="newPhotoPath() || ''"
                      (valueChange)="newPhotoPath.set($event)"
                    />
                  </div>
                  <div class="col-md-6 flex flex-col justify-between">
                    <div>
                      <label class="form-label text-sm" for="stagedCaption">Keterangan Foto</label>
                      <input
                        type="text"
                        id="stagedCaption"
                        class="form-control"
                        placeholder="Cth: Dokumentasi pembukaan"
                        [(ngModel)]="newPhotoCaption"
                      />
                    </div>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm mt-sm self-start"
                      [disabled]="!newPhotoPath()"
                      (click)="addStagedPhoto()"
                    >
                      + Tambahkan ke Daftar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Staged Photos Grid -->
              @if (stagedPhotos().length > 0) {
                <div class="staged-grid">
                  @for (p of stagedPhotos(); track $index; let i = $index) {
                    <div class="staged-card">
                      <img [src]="imgUrl(p.imagePath)" [alt]="p.caption || 'Foto ' + (i + 1)" class="staged-img" />
                      <div class="staged-info">
                        <span class="text-xs text-muted font-bold">#{{ i + 1 }}</span>
                        <span class="staged-caption">{{ p.caption || '(Tanpa caption)' }}</span>
                        <button type="button" class="btn btn-sm btn-icon text-danger" (click)="removeStagedPhoto(i)">
                          <app-icon name="trash" [size]="12" />
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .form-grid-layout {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1040px;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .border-b {
      border-bottom: 1px solid var(--color-border);
    }

    .add-photo-box {
      background: var(--color-bg-alt);
      border: 1px dashed var(--color-border);
      border-radius: 12px;
    }

    .photo-tiles {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    .photo-tile {
      display: flex;
      gap: 12px;
      padding: 10px;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      align-items: center;
    }

    .photo-tile-img {
      width: 80px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .photo-tile-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .photo-order-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--color-primary);
    }

    .photo-caption-text {
      font-size: 0.82rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .photo-actions {
      display: flex;
      gap: 6px;
      margin-top: 2px;
    }

    .btn-icon-sm {
      background: var(--color-bg-alt);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-text-secondary);
      transition: all 0.2s;
    }

    .btn-icon-sm:hover:not(:disabled) {
      background: #fff;
      border-color: var(--color-primary);
    }

    .btn-icon-sm:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .staged-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    .staged-card {
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .staged-img {
      width: 100%;
      height: 120px;
      object-fit: cover;
    }

    .staged-info {
      padding: 8px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .staged-caption {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    @media (max-width: 768px) {
      .photo-tiles {
        grid-template-columns: 1fr;
      }
      .staged-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class GalleryFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private repo = inject(GalleryRepository);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private location = inject(Location);
  private toast = inject(ToastService);

  isEdit = signal(false);
  editId = signal<number | null>(null);
  loading = signal(false);
  photosLoading = signal(false);
  submitting = signal(false);
  submitTried = signal(false);
  addingPhoto = signal(false);

  coverImagePath = signal<string | null>(null);

  // Photo management state
  existingPhotos = signal<GalleryPhoto[]>([]);
  stagedPhotos = signal<CreatePhotoItemReq[]>([]);
  newPhotoPath = signal<string | null>(null);
  newPhotoCaption = '';

  form = this.fb.group({
    eventName: ['', [Validators.required, Validators.maxLength(255)]],
    eventTheme: ['', [Validators.required, Validators.maxLength(255)]],
    eventDate: [''],
    youtubeVideoID: [''],
    documentLink: ['', [Validators.maxLength(500)]],
    eventDescription: ['', [Validators.required]],
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.editId.set(Number(idParam));
      this.title.setTitle('Edit Galeri - CMS FSLDK');
      this.loadData(Number(idParam));
      this.loadPhotos(Number(idParam));
    } else {
      this.title.setTitle('Tambah Galeri - CMS FSLDK');
    }
  }

  loadData(id: number): void {
    this.loading.set(true);
    this.repo.getCMS(id).subscribe({
      next: (res) => {
        const item = res.result;
        this.form.patchValue({
          eventName: item.eventName,
          eventTheme: item.eventTheme,
          eventDate: item.eventDate ? item.eventDate.substring(0, 10) : '',
          youtubeVideoID: item.youtubeVideoID || '',
          documentLink: item.documentLink || '',
          eventDescription: item.eventDescription,
        });
        this.coverImagePath.set(item.coverImage);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Gagal memuat galeri');
        this.router.navigate(['/cms/galleries']);
      },
    });
  }

  loadPhotos(galleryID: number): void {
    this.photosLoading.set(true);
    this.repo.loadPhotosCMS(galleryID, 1, 100).subscribe({
      next: (res) => {
        this.existingPhotos.set(res.result.data || []);
        this.photosLoading.set(false);
      },
      error: () => {
        this.photosLoading.set(false);
      },
    });
  }

  onDescriptionChange(val: string): void {
    this.form.patchValue({ eventDescription: val });
    this.form.controls.eventDescription.markAsDirty();
    this.form.controls.eventDescription.markAsTouched();
  }

  // Create Mode: Stage Photo
  addStagedPhoto(): void {
    const path = this.newPhotoPath();
    if (!path) return;
    const item: CreatePhotoItemReq = {
      imagePath: path,
      caption: this.newPhotoCaption.trim() || null,
      sortOrder: this.stagedPhotos().length,
    };
    this.stagedPhotos.set([...this.stagedPhotos(), item]);
    this.newPhotoPath.set(null);
    this.newPhotoCaption = '';
  }

  removeStagedPhoto(index: number): void {
    const list = this.stagedPhotos().filter((_, i) => i !== index);
    this.stagedPhotos.set(list);
  }

  // Edit Mode: Add Photo via Sub-endpoint
  onAddPhotoCMS(): void {
    const path = this.newPhotoPath();
    const id = this.editId();
    if (!path || !id) return;

    this.addingPhoto.set(true);
    const req = {
      imagePath: path,
      caption: this.newPhotoCaption.trim() || null,
      sortOrder: this.existingPhotos().length,
    };

    this.repo.addPhoto(id, req).subscribe({
      next: () => {
        this.toast.success('Foto berhasil ditambahkan');
        this.newPhotoPath.set(null);
        this.newPhotoCaption = '';
        this.addingPhoto.set(false);
        this.loadPhotos(id);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal menambahkan foto');
        this.addingPhoto.set(false);
      },
    });
  }

  editPhotoCaption(photo: GalleryPhoto): void {
    const current = photo.caption || '';
    const updated = prompt('Ubah keterangan / caption foto:', current);
    if (updated === null || updated === current) return;

    const id = this.editId();
    if (!id) return;

    this.repo.updatePhoto(id, photo.photoID, { caption: updated }).subscribe({
      next: () => {
        this.toast.success('Caption berhasil diperbarui');
        this.loadPhotos(id);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal memperbarui caption');
      },
    });
  }

  deletePhotoCMS(photoID: number): void {
    if (!confirm('Hapus foto ini dari galeri?')) return;
    const id = this.editId();
    if (!id) return;

    this.repo.deletePhoto(id, photoID).subscribe({
      next: () => {
        this.toast.success('Foto berhasil dihapus');
        this.loadPhotos(id);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal menghapus foto');
      },
    });
  }

  movePhoto(index: number, direction: -1 | 1): void {
    const photos = [...this.existingPhotos()];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= photos.length) return;

    // Swap items
    const temp = photos[index];
    photos[index] = photos[targetIdx];
    photos[targetIdx] = temp;

    this.existingPhotos.set(photos);

    const id = this.editId();
    if (!id) return;

    const order = photos.map((p) => p.photoID);
    this.repo.reorderPhotos(id, { order }).subscribe({
      next: () => {
        this.toast.success('Urutan foto berhasil diperbarui');
      },
      error: () => {
        this.toast.error('Gagal memperbarui urutan foto');
        this.loadPhotos(id);
      },
    });
  }

  onSubmit(): void {
    this.submitTried.set(true);
    if (this.form.invalid || !this.form.value.eventDescription?.trim() || !this.coverImagePath()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    if (this.isEdit()) {
      const payload = {
        eventName: this.form.value.eventName!,
        eventTheme: this.form.value.eventTheme!,
        eventDate: this.form.value.eventDate || null,
        eventDescription: this.form.value.eventDescription!,
        coverImage: this.coverImagePath()!,
        youtubeVideoID: this.form.value.youtubeVideoID || null,
        documentLink: this.form.value.documentLink || null,
      };

      this.repo.update(this.editId()!, payload).pipe(
        catchError((err) => {
          this.toast.error('Gagal mengupdate galeri: ' + (err.error?.message || 'Unknown error'));
          this.submitting.set(false);
          return EMPTY;
        })
      ).subscribe(() => {
        this.toast.success('Metadata galeri berhasil disimpan');
        this.router.navigate(['/cms/galleries']);
      });
    } else {
      const payload = {
        eventName: this.form.value.eventName!,
        eventTheme: this.form.value.eventTheme!,
        eventDate: this.form.value.eventDate || null,
        eventDescription: this.form.value.eventDescription!,
        coverImage: this.coverImagePath()!,
        youtubeVideoID: this.form.value.youtubeVideoID || null,
        documentLink: this.form.value.documentLink || null,
        photos: this.stagedPhotos(),
      };

      this.repo.create(payload).pipe(
        catchError((err) => {
          this.toast.error('Gagal membuat galeri: ' + (err.error?.message || 'Unknown error'));
          this.submitting.set(false);
          return EMPTY;
        })
      ).subscribe(() => {
        this.toast.success('Galeri berhasil dibuat');
        this.router.navigate(['/cms/galleries']);
      });
    }
  }

  back(): void {
    this.location.back();
  }

  imgUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/uploads/${path}`;
  }
}
