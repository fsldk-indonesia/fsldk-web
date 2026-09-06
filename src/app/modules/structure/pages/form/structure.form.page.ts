import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StructureRepository } from '../../repositories/structure.repository';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { catchError, EMPTY } from 'rxjs';
import { Location } from '@angular/common';

@Component({
  selector: 'app-structure-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ImageUploadComponent, RichTextEditorComponent],
  template: `
    <div class="page-head">
      <a routerLink="/cms/structures" class="back">← Kembali</a>
      <h1>{{ isEdit() ? 'Ubah Struktur' : 'Tambah Struktur' }}</h1>
    </div>

    <div class="card card-pad form-card">
      @if (loading()) {
        <div class="text-center py-xl">
          <div class="spinner"></div>
          <p class="mt-sm text-muted">Memuat data struktur…</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <p class="section-title">Informasi Kepengurusan</p>

          <div class="form-group">
            <label class="form-label" for="structureName">Nama Kepengurusan <span style="color:red">*</span></label>
            <input
              type="text"
              id="structureName"
              class="form-control"
              formControlName="structureName"
              placeholder="Contoh: Kabinet Al-Fatih"
            />
            @if (f['structureName'].invalid && (f['structureName'].dirty || f['structureName'].touched || submitTried())) {
              <div class="form-error">Nama kepengurusan wajib diisi (maksimal 255 karakter).</div>
            }
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="batch">Angkatan <span style="color:red">*</span></label>
              <input
                type="text"
                id="batch"
                class="form-control"
                formControlName="batch"
                placeholder="Contoh: Ke-32 atau XXXII"
              />
              @if (f['batch'].invalid && (f['batch'].dirty || f['batch'].touched || submitTried())) {
                <div class="form-error">Angkatan wajib diisi (maksimal 50 karakter).</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="period">Periode <span style="color:red">*</span></label>
              <input
                type="text"
                id="period"
                class="form-control"
                formControlName="period"
                placeholder="Contoh: 2025/2026"
              />
              @if (f['period'].invalid && (f['period'].dirty || f['period'].touched || submitTried())) {
                <div class="form-error">Periode wajib diisi (maksimal 50 karakter).</div>
              }
            </div>
          </div>

          <p class="section-title">Logo &amp; Bagan Organisasi</p>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Logo Kepengurusan @if (!isEdit()) { <span style="color:red">*</span> }</label>
              <app-image-upload
                [value]="logoPath() || ''"
                (valueChange)="logoPath.set($event)"
              />
              <p class="form-hint">Format JPG/PNG/WebP, rasio 1:1 direkomendasikan. Maks 2MB.</p>
              @if (submitTried() && !logoPath() && !isEdit()) {
                <div class="form-error">Logo kepengurusan wajib diunggah.</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Bagan Struktur @if (!isEdit()) { <span style="color:red">*</span> }</label>
              <app-image-upload
                [value]="chartPath() || ''"
                (valueChange)="chartPath.set($event)"
              />
              <p class="form-hint">Gambar hierarki struktur organisasi. Maks 5MB.</p>
              @if (submitTried() && !chartPath() && !isEdit()) {
                <div class="form-error">Bagan struktur wajib diunggah.</div>
              }
            </div>
          </div>

          <p class="section-title">Deskripsi &amp; Profil</p>
          <div class="form-group">
            <label class="form-label">Deskripsi Lengkap <span style="color:red">*</span></label>
            <app-rich-text-editor
              [value]="form.value.structureDescription || ''"
              (valueChange)="onDescriptionChange($event)"
            />
            @if (submitTried() && (!form.value.structureDescription || !form.value.structureDescription.trim())) {
              <div class="form-error">Deskripsi kepengurusan wajib diisi.</div>
            }
          </div>

          <div class="flex gap justify-between" style="margin-top:32px; padding-top:20px; border-top:1px solid var(--color-border)">
            <a routerLink="/cms/structures" class="btn btn-ghost">Batal</a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting()">
              @if (submitting()) { <span class="spinner"></span> } @else { {{ isEdit() ? 'Simpan Perubahan' : 'Simpan Struktur' }} }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-card { max-width: 840px; margin: 0 auto; }
    .section-title { font-size: .85rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: var(--color-muted); margin: 24px 0 14px; padding-bottom: 6px; border-bottom: 1px solid var(--color-border); }
    .section-title:first-child { margin-top: 0; }
    .form-error { color: var(--color-danger, #dc2626); font-size: .8rem; margin-top: 4px; font-weight: 500; }
    .form-hint { color: var(--color-muted); font-size: .8rem; margin-top: 4px; }
  `]
})
export class StructureFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private repo = inject(StructureRepository);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private location = inject(Location);

  isEdit = signal(false);
  editId = signal<number | null>(null);
  loading = signal(false);
  submitting = signal(false);
  submitTried = signal(false);

  initialLogo = signal<string | null>(null);
  initialChart = signal<string | null>(null);
  
  logoPath = signal<string | null>(null);
  chartPath = signal<string | null>(null);

  form = this.fb.group({
    batch: ['', [Validators.required, Validators.maxLength(50)]],
    period: ['', [Validators.required, Validators.maxLength(50)]],
    structureName: ['', [Validators.required, Validators.maxLength(255)]],
    structureDescription: ['', [Validators.required]],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId.set(Number(id));
      this.title.setTitle('Edit Struktur - CMS FSLDK');
      this.loadData(Number(id));
    } else {
      this.title.setTitle('Tambah Struktur - CMS FSLDK');
    }
  }

  loadData(id: number): void {
    this.loading.set(true);
    this.repo.getByID(id).subscribe({
      next: (res) => {
        const data = res.result;
        this.form.patchValue({
          batch: data.batch,
          period: data.period,
          structureName: data.structureName,
          structureDescription: data.structureDescription
        });
        
        if (data.logoImage) {
          this.initialLogo.set(data.logoImage);
          this.logoPath.set(data.logoImage);
        }
        if (data.structureImage) {
          this.initialChart.set(data.structureImage);
          this.chartPath.set(data.structureImage);
        }
        
        this.loading.set(false);
      },
      error: () => {
        alert('Gagal memuat data struktur');
        this.router.navigate(['/cms/structures']);
      }
    });
  }

  onLogoUploaded(path: string): void { this.logoPath.set(path); }
  onLogoRemoved(): void { this.logoPath.set(null); }
  onChartUploaded(path: string): void { this.chartPath.set(path); }
  onChartRemoved(): void { this.chartPath.set(null); }

  onDescriptionChange(val: string): void {
    this.form.patchValue({ structureDescription: val });
    this.form.controls.structureDescription.markAsDirty();
    this.form.controls.structureDescription.markAsTouched();
  }

  onSubmit(): void {
    this.submitTried.set(true);
    if (this.form.invalid || !this.form.value.structureDescription?.trim()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.isEdit()) {
      if (!this.logoPath() || !this.chartPath()) return;
    }

    this.submitting.set(true);
    
    if (this.isEdit()) {
      const payload: any = { ...this.form.value };
      if (this.logoPath() !== this.initialLogo()) payload.logoImage = this.logoPath();
      if (this.chartPath() !== this.initialChart()) payload.structureImage = this.chartPath();
      
      this.repo.update(this.editId()!, payload).pipe(
        catchError(err => {
          alert('Gagal mengupdate: ' + (err.error?.message || 'Unknown error'));
          this.submitting.set(false);
          return EMPTY;
        })
      ).subscribe(() => {
        this.router.navigate(['/cms/structures']);
      });
    } else {
      const payload: any = {
        ...this.form.value,
        logoImage: this.logoPath(),
        structureImage: this.chartPath()
      };
      
      this.repo.create(payload).pipe(
        catchError(err => {
          alert('Gagal membuat struktur: ' + (err.error?.message || 'Unknown error'));
          this.submitting.set(false);
          return EMPTY;
        })
      ).subscribe(() => {
        this.router.navigate(['/cms/structures']);
      });
    }
  }

  back(): void {
    this.location.back();
  }
}
