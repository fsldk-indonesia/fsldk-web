import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PdfUploadComponent } from '../../../../shared/pdf-upload.component';
import { SelectComponent } from '../../../../shared/select.component';
import { FinanceFormatType } from '../../entities/finance-format-type';
import { FinanceFormatFormPresenter, FinanceFormatFormValue, emptyFinanceFormatForm } from './financeformat.form.presenter';
import { FinanceFormatFormView } from './financeformat.form.view';

@Component({
  selector: 'app-financeformat-form-page',
  standalone: true,
  templateUrl: './financeformat.form.page.html',
  imports: [FormsModule, RouterLink, PdfUploadComponent, SelectComponent],
  providers: [FinanceFormatFormPresenter],
  styles: [`
    .page-head { max-width: 720px; margin: 0 auto 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 720px; margin: 0 auto; }
  `],
})
export class FinanceFormatFormPage implements OnInit, FinanceFormatFormView {
  private presenter = inject(FinanceFormatFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  types = signal<FinanceFormatType[]>([]);
  saving = signal(false);
  editId: number | null = null;
  form: FinanceFormatFormValue = { ...emptyFinanceFormatForm };

  // Excel-only upload — the shared /uploads/document endpoint still accepts
  // pdf/docx for other modules, so the restriction is enforced here and again
  // in the service.
  readonly excelExtensions = ['.xlsx'];
  typeOptions = computed(() => this.types().map((t) => ({ value: t.formatTypeID, label: t.formatTypeName })));

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadTypes();

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
