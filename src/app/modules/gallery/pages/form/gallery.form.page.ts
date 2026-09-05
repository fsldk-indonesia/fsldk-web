import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { catchError, EMPTY } from 'rxjs';

import { GalleryRepository } from '../../repositories/gallery.repository';
import { GalleryPhoto, CreatePhotoItemReq } from '../../entities/gallery';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { DateTimePickerComponent } from '../../../../shared/datetime-picker.component';
import { ModalBackdropDirective } from '../../../../shared/modal-backdrop.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertService } from '../../../../core/services/alert.service';
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
    RouterLink,
    IconComponent,
    ImageUploadComponent,
    RichTextEditorComponent,
    DateTimePickerComponent,
    ModalBackdropDirective,
  ],
  template: `
    <div class="page-head">
      <a routerLink="/cms/galleries" class="back">← Kembali</a>
      <h1>{{ isEdit() ? 'Ubah Galeri' : 'Tambah Galeri' }}</h1>
    </div>

    @if (loading()) {
      <div class="card card-pad form-card text-center py-xl">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat data galeri…</p>
      </div>
    } @else {
      <!-- Main Metadata Form Card -->
      <div class="card card-pad form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <p class="section-title">Informasi Utama Kegiatan</p>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="eventName">Nama Kegiatan / Event <span style="color:red">*</span></label>
              <input
                type="text"
                id="eventName"
                class="form-control"
                formControlName="eventName"
                placeholder="Contoh: Rakornas FSLDK Indonesia 2026"
              />
              @if (f['eventName'].invalid && (f['eventName'].dirty || f['eventName'].touched || submitTried())) {
                <div class="form-error">Nama kegiatan wajib diisi (maksimal 255 karakter).</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="eventTheme">Tema / Tagline Kegiatan <span style="color:red">*</span></label>
              <input
                type="text"
                id="eventTheme"
                class="form-control"
                formControlName="eventTheme"
                placeholder="Contoh: Bersatu dalam Dakwah Membangun Peradaban"
              />
              @if (f['eventTheme'].invalid && (f['eventTheme'].dirty || f['eventTheme'].touched || submitTried())) {
                <div class="form-error">Tema kegiatan wajib diisi (maksimal 255 karakter).</div>
              }
            </div>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="eventDate">Tanggal Pelaksanaan Kegiatan</label>
              <app-datetime-picker
                formControlName="eventDate"
                [showTime]="false"
                placeholder="Pilih tanggal kegiatan…"
              />
              <p class="form-hint">Tanggal saat kegiatan diselenggarakan.</p>
            </div>

            <div class="form-group">
              <label class="form-label" for="youtubeVideoID">Tautan / ID Video YouTube <span class="text-muted">(opsional)</span></label>
              <input
                type="text"
                id="youtubeVideoID"
                class="form-control"
                formControlName="youtubeVideoID"
                placeholder="Contoh: https://www.youtube.com/watch?v=…"
              />
              <p class="form-hint">Bisa berupa tautan YouTube atau Video ID.</p>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="documentLink">Tautan Dokumentasi Lengkap <span class="text-muted">(opsional, mis. Google Drive)</span></label>
            <input
              type="url"
              id="documentLink"
              class="form-control"
              formControlName="documentLink"
              placeholder="Contoh: https://drive.google.com/drive/folders/…"
            />
            <p class="form-hint">Link Google Drive / Cloud Storage untuk arsip dokumentasi resolusi penuh.</p>
          </div>

          <p class="section-title">Foto Sampul (Cover)</p>
          <div class="form-group">
            <label class="form-label">Foto Sampul <span style="color:red">*</span></label>
            <app-image-upload
              [value]="coverImagePath() || ''"
              (valueChange)="coverImagePath.set($event)"
            />
            <p class="form-hint">Format JPG/PNG/WebP, rasio 16:9 atau 4:3 direkomendasikan.</p>
            @if (submitTried() && !coverImagePath()) {
              <div class="form-error">Foto sampul wajib diunggah.</div>
            }
          </div>

          <p class="section-title">Deskripsi Kegiatan</p>
          <div class="form-group">
            <label class="form-label">Deskripsi Lengkap <span style="color:red">*</span></label>
            <app-rich-text-editor
              [value]="form.value.eventDescription || ''"
              (valueChange)="onDescriptionChange($event)"
            />
            @if (submitTried() && (!form.value.eventDescription || !form.value.eventDescription.trim())) {
              <div class="form-error">Deskripsi kegiatan wajib diisi.</div>
            }
          </div>

          <div class="flex gap justify-between" style="margin-top:32px; padding-top:20px; border-top:1px solid var(--color-border)">
            <a routerLink="/cms/galleries" class="btn btn-ghost">Batal</a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting()">
              @if (submitting()) { <span class="spinner"></span> } @else { {{ isEdit() ? 'Simpan Perubahan' : 'Simpan Galeri' }} }
            </button>
          </div>
        </form>
      </div>

      <!-- Photos Section Card -->
      <div class="card card-pad form-card" style="margin-top: 24px">
        <p class="section-title" style="margin-top: 0">
          <app-icon name="images" [size]="16" />
          {{ isEdit() ? 'Kelola Foto Tambahan (' + existingPhotos().length + ' Foto)' : 'Foto Tambahan Awal (Opsional)' }}
        </p>

        @if (isEdit()) {
          <!-- Add New Photo Box -->
          <div class="add-photo-box">
            <h4 style="font-size: .92rem; font-weight: 700; margin: 0 0 14px">Tambah Satu Foto ke Galeri</h4>
            <div class="grid grid-2">
              <div>
                <app-image-upload
                  [value]="newPhotoPath() || ''"
                  (valueChange)="newPhotoPath.set($event)"
                />
              </div>
              <div class="photo-input-column">
                <div class="form-group" style="margin-bottom: 16px">
                  <label class="form-label" for="newCaption">Keterangan / Caption <span class="text-muted">(opsional)</span></label>
                  <input
                    type="text"
                    id="newCaption"
                    class="form-control"
                    placeholder="Contoh: Sesi foto bersama peserta"
                    [(ngModel)]="newPhotoCaption"
                  />
                  <p class="form-hint" style="margin-top: 6px">Teks keterangan foto saat dibuka di galeri.</p>
                </div>
                <div class="photo-btn-wrap">
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    [disabled]="!newPhotoPath() || addingPhoto()"
                    (click)="onAddPhotoCMS()"
                  >
                    @if (addingPhoto()) { <span class="spinner spinner-xs"></span> } @else { + Simpan Foto Baru }
                  </button>
                </div>
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
                          title="Ubah Keterangan"
                          (click)="openEditCaptionModal(photo)"
                        >
                          <app-icon name="edit" [size]="12" />
                        </button>
                        <button
                          type="button"
                          class="btn-icon-sm text-danger"
                          title="Hapus Foto"
                          (click)="deletePhotoCMS(photo.photoID, $event)"
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
          <div>
            <p class="text-muted text-sm" style="margin-bottom: 16px">
              Anda dapat menambahkan beberapa foto sekarang atau menyimpannya terlebih dahulu lalu mengelolanya nanti.
            </p>

            <!-- Upload photo to stage -->
            <div class="add-photo-box">
              <div class="grid grid-2">
                <div>
                  <label class="form-label text-sm">Unggah Foto</label>
                  <app-image-upload
                    [value]="newPhotoPath() || ''"
                    (valueChange)="newPhotoPath.set($event)"
                  />
                </div>
                <div class="photo-input-column">
                  <div class="form-group" style="margin-bottom: 16px">
                    <label class="form-label" for="stagedCaption">Keterangan Foto <span class="text-muted">(opsional)</span></label>
                    <input
                      type="text"
                      id="stagedCaption"
                      class="form-control"
                      placeholder="Contoh: Dokumentasi pembukaan"
                      [(ngModel)]="newPhotoCaption"
                    />
                    <p class="form-hint" style="margin-top: 6px">Teks keterangan foto saat dibuka di galeri.</p>
                  </div>
                  <div class="photo-btn-wrap">
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      [disabled]="!newPhotoPath()"
                      (click)="addStagedPhoto()"
                    >
                      + Tambahkan ke Daftar
                    </button>
                  </div>
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
                      <button type="button" class="icon-action danger" style="width: 26px; height: 26px" (click)="removeStagedPhoto(i)">
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

      <!-- Modal Pop-up: Ubah Caption Foto -->
      @if (editingCaptionPhoto(); as photo) {
        <div class="modal-backdrop" appModalBackdrop (backdropClose)="closeCaptionModal()">
          <div class="modal modal-pop" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">
                <app-icon name="edit" [size]="16" /> Ubah Keterangan Foto
              </h3>
              <button type="button" class="btn-close" (click)="closeCaptionModal()" [disabled]="savingCaption()">
                <app-icon name="x" [size]="16" />
              </button>
            </div>

            <div class="modal-body">
              <div class="caption-preview-box">
                <img [src]="imgUrl(photo.imagePath)" alt="Preview foto" class="caption-preview-thumb" />
                <p class="caption-preview-hint">
                  Keterangan ini akan ditampilkan saat pengunjung membuka foto di galeri publik maupun modal lightbox.
                </p>
              </div>

              <div class="form-group mb-0">
                <label class="form-label" for="captionField">Keterangan / Caption</label>
                <input
                  type="text"
                  id="captionField"
                  class="form-control"
                  placeholder="Masukkan keterangan foto..."
                  [ngModel]="editingCaptionText()"
                  (ngModelChange)="editingCaptionText.set($event)"
                  (keydown.enter)="savePhotoCaption()"
                  autofocus
                />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline btn-sm" (click)="closeCaptionModal()" [disabled]="savingCaption()">
                Batal
              </button>
              <button type="button" class="btn btn-primary btn-sm" (click)="savePhotoCaption()" [disabled]="savingCaption()">
                @if (savingCaption()) { <div class="spinner spinner-sm mr-xs"></div> }
                Simpan Keterangan
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .form-card {
      max-width: 860px;
      margin: 0 auto;
    }

    .section-title {
      font-size: .85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--color-muted);
      margin: 24px 0 14px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title:first-child {
      margin-top: 0;
    }

    .form-error {
      color: var(--color-danger, #dc2626);
      font-size: .8rem;
      margin-top: 4px;
      font-weight: 500;
    }

    .form-hint {
      color: var(--color-muted);
      font-size: .8rem;
      margin-top: 4px;
    }

    .add-photo-box {
      background: var(--color-bg-alt);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-md, 12px);
      padding: 20px;
      margin-top: 14px;
      margin-bottom: 24px;
    }

    .photo-input-column {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100%;
    }

    .photo-btn-wrap {
      margin-top: 16px;
      padding-top: 6px;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 20, 15, 0.55);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 20px;
      animation: modal-fade-in 0.2s ease;
    }

    @keyframes modal-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal {
      background: #fff;
      border-radius: var(--radius-lg, 16px);
      padding: 24px 28px;
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--color-border);
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text);
    }

    .btn-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }

    .btn-close:hover {
      background: var(--color-bg-alt);
      color: var(--color-text);
    }

    .caption-preview-box {
      display: flex;
      gap: 14px;
      align-items: center;
      background: var(--color-bg-alt);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .caption-preview-thumb {
      width: 64px;
      height: 48px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .caption-preview-hint {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 18px;
      margin-top: 20px;
      border-top: 1px solid var(--color-border);
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
  private alert = inject(AlertService);

  isEdit = signal(false);
  editId = signal<number | null>(null);
  loading = signal(false);
  photosLoading = signal(false);
  submitting = signal(false);
  submitTried = signal(false);
  addingPhoto = signal(false);

  // Edit Caption Modal state
  editingCaptionPhoto = signal<GalleryPhoto | null>(null);
  editingCaptionText = signal('');
  savingCaption = signal(false);

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
    const id = this.editId();
    if (!photo || !id) return;

    const updated = this.editingCaptionText().trim();
    this.savingCaption.set(true);

    this.repo.updatePhoto(id, photo.photoID, { caption: updated || null }).subscribe({
      next: () => {
        this.toast.success('Caption berhasil diperbarui');
        this.savingCaption.set(false);
        this.closeCaptionModal();
        this.loadPhotos(id);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal memperbarui caption');
        this.savingCaption.set(false);
      },
    });
  }

  async deletePhotoCMS(photoID: number, event?: MouseEvent): Promise<void> {
    const ok = await this.alert.confirm(
      'Hapus foto ini dari galeri? File foto akan dihapus secara permanen.',
      {
        title: 'Hapus Foto Dokumentasi',
        confirmLabel: 'Ya, Hapus Foto',
        cancelLabel: 'Batal',
        variant: 'danger',
      },
      event,
    );
    if (!ok) return;

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
