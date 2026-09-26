import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { StructureFormPresenter, StructureFormValue, emptyStructureForm } from './structure.form.presenter';
import { StructureFormView } from './structure.form.view';

@Component({
  selector: 'app-structure-form',
  standalone: true,
  templateUrl: './structure.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent, ImageUploadComponent, RichTextEditorComponent],
  providers: [StructureFormPresenter],
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
  `],
})
export class StructureFormPage implements OnInit, StructureFormView {
  private presenter = inject(StructureFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat structure.routes.ts), bukan
  // URL atau state terpisah, supaya layout field tidak dobel-maintain di 2 file.
  isReadonly = false;
  form: StructureFormValue = { ...emptyStructureForm };

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap struktur kepengurusan ini.';
    return this.editId ? 'Perbarui data kepengurusan yang sudah ada.' : 'Isi data kepengurusan yang akan diarsipkan.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);

    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setForm(form: StructureFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/structures']); }
}
