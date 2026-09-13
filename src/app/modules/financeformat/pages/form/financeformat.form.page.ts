import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/icon.component';
import { PdfUploadComponent } from '../../../../shared/pdf-upload.component';
import { SelectComponent } from '../../../../shared/select.component';
import { FinanceFormatType } from '../../entities/finance-format-type';
import { FinanceFormatFormPresenter, FinanceFormatFormValue, emptyFinanceFormatForm } from './financeformat.form.presenter';
import { FinanceFormatFormView } from './financeformat.form.view';

@Component({
  selector: 'app-financeformat-form-page',
  standalone: true,
  templateUrl: './financeformat.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent, PdfUploadComponent, SelectComponent],
  providers: [FinanceFormatFormPresenter],
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
export class FinanceFormatFormPage implements OnInit, FinanceFormatFormView {
  private presenter = inject(FinanceFormatFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  types = signal<FinanceFormatType[]>([]);
  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat financeformat.routes.ts),
  // pola sama seperti Perpustakaan/Event/Berita.
  isReadonly = false;
  form: FinanceFormatFormValue = { ...emptyFinanceFormatForm };

  // Excel-only upload — the shared /uploads/document endpoint still accepts
  // pdf/docx for other modules, so the restriction is enforced here and again
  // in the service.
  readonly excelExtensions = ['.xlsx'];
  typeOptions = computed(() => this.types().map((t) => ({ value: t.formatTypeID, label: t.formatTypeName })));

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap format keuangan ini.';
    return this.editId ? 'Perbarui informasi format keuangan yang sudah ada.' : 'Unggah template Excel baru untuk dibagikan ke publik.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadTypes();

    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setTypes(types: FinanceFormatType[]): void {
    this.types.set(types);
    if (!this.form.formatTypeID && types[0]) this.form.formatTypeID = types[0].formatTypeID;
  }
  setForm(form: FinanceFormatFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/finance-formats']); }
}
