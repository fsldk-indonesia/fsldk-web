import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StructureRepository } from '../../repositories/structure.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { catchError, EMPTY } from 'rxjs';
import { Location } from '@angular/common';

@Component({
  selector: 'app-structure-form',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ImageUploadComponent, RichTextEditorComponent],
  template: `
    <div class="cms-header">
      <div class="cms-header-content">
        <button type="button" class="btn btn-sm btn-icon btn-outline mr-md" (click)="back()">
          <app-icon name="arrow-left" [size]="16" />
        </button>
        <div>
          <h1 class="cms-title">{{ isEdit() ? 'Edit Struktur' : 'Tambah Struktur' }}</h1>
          <p class="cms-subtitle">{{ isEdit() ? 'Ubah data kepengurusan.' : 'Tambahkan data kepengurusan baru ke sistem.' }}</p>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="cms-card py-xl text-center">
        <div class="spinner"></div>
        <p class="mt-sm text-muted">Memuat data...</p>
      </div>
    } @else {
      <div class="cms-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-layout">
          
          <div class="form-group row">
            <div class="col-md-6">
              <label class="form-label" for="batch">Angkatan <span class="text-danger">*</span></label>
              <input type="text" id="batch" class="form-control" formControlName="batch" placeholder="Cth: XXXII atau Ke-32">
              @if (f['batch'].invalid && (f['batch'].dirty || f['batch'].touched)) {
                <div class="form-error">Wajib diisi, maks 50 karakter.</div>
              }
            </div>
            <div class="col-md-6">
              <label class="form-label" for="period">Periode <span class="text-danger">*</span></label>
              <input type="text" id="period" class="form-control" formControlName="period" placeholder="Cth: 2025/2026">
              @if (f['period'].invalid && (f['period'].dirty || f['period'].touched)) {
                <div class="form-error">Wajib diisi, maks 50 karakter.</div>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="structureName">Nama Kepengurusan <span class="text-danger">*</span></label>
            <input type="text" id="structureName" class="form-control" formControlName="structureName" placeholder="Cth: Kabinet Al-Fatih">
            @if (f['structureName'].invalid && (f['structureName'].dirty || f['structureName'].touched)) {
              <div class="form-error">Wajib diisi, maks 255 karakter.</div>
            }
          </div>

          <div class="form-group row">
            <div class="col-md-6">
              <label class="form-label">Logo Kepengurusan @if(!isEdit()) {<span class="text-danger">*</span>}</label>
              <app-image-upload
                [value]="logoPath() || ''"
                (valueChange)="logoPath.set($event)">
              </app-image-upload>
              <p class="form-text mt-sm text-muted">Rasio 1:1 direkomendasikan. Maks 2MB.</p>
              @if (submitTried() && !logoPath() && !isEdit()) {
                <div class="form-error">Logo wajib diunggah.</div>
              }
            </div>
            
            <div class="col-md-6">
              <label class="form-label">Bagan Struktur @if(!isEdit()) {<span class="text-danger">*</span>}</label>
              <app-image-upload
                [value]="chartPath() || ''"
                (valueChange)="chartPath.set($event)">
              </app-image-upload>
              <p class="form-text mt-sm text-muted">Gambar bagan hierarki organisasi. Maks 5MB.</p>
              @if (submitTried() && !chartPath() && !isEdit()) {
                <div class="form-error">Bagan struktur wajib diunggah.</div>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi & Penjelasan <span class="text-danger">*</span></label>
            <app-rich-text-editor
              [value]="form.value.structureDescription || ''"
              (valueChange)="onDescriptionChange($event)">
            </app-rich-text-editor>
            @if (submitTried() && (!form.value.structureDescription || !form.value.structureDescription.trim())) {
              <div class="form-error">Wajib diisi.</div>
            }
          </div>

          <div class="form-actions mt-lg">
            <button type="button" class="btn btn-outline" (click)="back()" [disabled]="submitting()">Batal</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting()">
              @if (submitting()) { <div class="spinner spinner-sm mr-xs"></div> }
              {{ isEdit() ? 'Simpan Perubahan' : 'Buat Struktur' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .form-layout { max-width: 960px; }
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
