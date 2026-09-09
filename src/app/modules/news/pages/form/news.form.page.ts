import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { IconComponent } from '../../../../shared/icon.component';
import { ImageUploadComponent } from '../../../../shared/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/rich-text-editor.component';
import { SelectComponent } from '../../../../shared/select.component';
import { NewsCategory } from '../../entities/news-category';
import { NewsFormPresenter, NewsFormValue, emptyNewsForm } from './news.form.presenter';
import { NewsFormView } from './news.form.view';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

@Component({
  selector: 'app-news-form-page',
  standalone: true,
  templateUrl: './news.form.page.html',
  imports: [FormsModule, RouterLink, IconComponent, ImageUploadComponent, RichTextEditorComponent, SelectComponent],
  providers: [NewsFormPresenter],
  styles: [`
    /* Lebar kolom form. RIWAYAT: 820px lalu 640px lalu 860px semua masih
       menyisakan margin kiri-kanan kosong yang kelihatan besar — sebabnya
       .page-shell pembungkus CMS (cms-layout.component.ts) sendiri sudah
       dibatasi 1100px dengan padding sendiri, jadi mengunci lebar form ke
       angka tetap manapun di bawah itu selalu menyisakan sisa. Solusinya
       bukan cari angka pas, tapi berhenti mengunci lebar sama sekali —
       biarkan form mengisi penuh lebar page-shell (sama seperti kartu
       tabel index Berita yang juga tidak dibatasi lebarnya sendiri). */
    .page-head { margin: 0 0 24px; }
    /* form-card sekarang cuma wadah layout (bukan .card lagi) — tiap seksi
       adalah kartu sendiri-sendiri (lihat .form-section-card) yang ditumpuk
       dengan jarak, bukan satu kartu besar berisi seksi yang dipisah garis
       tipis. Shadow-nya dibiarkan bawaan .card (--shadow-sm, tipis) — sama
       seperti kartu-kartu Dashboard, bukan shadow tebal. */
    /* gap 20px — sama seperti jarak antar .card-section di Dashboard
       (margin-top: 20px), supaya rhythm-nya konsisten lintas halaman. */
    .form-card { display: flex; flex-direction: column; gap: 20px; }
    .form-section-label {
      display: flex; align-items: center; gap: 8px; margin: 0 0 16px;
      font-family: var(--font-heading); font-weight: 700; font-size: .78rem;
      letter-spacing: .08em; text-transform: uppercase; color: var(--color-primary-dark);
    }

    /* Judul berita ditekankan lewat bobot huruf (bukan lagi ukuran font
       berlebihan) — versi sebelumnya (1.15rem + padding 14px) di kartu
       sempit tetap terasa besar-besaran untuk satu baris teks pendek. */
    .form-control-lg { font-weight: 700; }

    .form-group-tight { margin-bottom: 0; }

    /* Tombol aksi rapat di kanan (bukan justify-between kiri-kanan seperti
       sebelumnya) — sesuai revisi: Batal & Simpan Berita berdampingan. */
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 22px; margin-top: 4px; border-top: 1px solid var(--color-border); }
  `],
})
export class NewsFormPage implements OnInit, NewsFormView {
  private presenter = inject(NewsFormPresenter);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthRepository);

  categories = signal<NewsCategory[]>([]);
  saving = signal(false);
  editId: number | null = null;
  // Halaman detail (read-only) memakai komponen yang sama dengan form edit —
  // dibedakan lewat route data `viewOnly` (lihat news.routes.ts), bukan URL
  // atau state terpisah, supaya layout field tidak dobel-maintain di 2 file.
  isReadonly = false;
  canPublish = this.auth.hasPermission('news.publish');
  form: NewsFormValue = { ...emptyNewsForm };
  statusOptions = STATUS_OPTIONS;
  categoryOptions = computed(() => this.categories().map((c) => ({ value: c.categoryID, label: c.categoryName })));

  get pageSubtitle(): string {
    if (this.isReadonly) return 'Lihat detail lengkap berita ini.';
    return this.editId ? 'Perbarui informasi berita yang sudah ada.' : 'Isi informasi berita yang akan dipublikasikan ke pengguna.';
  }

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();

    this.isReadonly = this.route.snapshot.data['viewOnly'] === true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.presenter.loadForEdit(this.editId);
    }
  }

  save(): void { this.presenter.save(this.editId, this.form); }

  setCategories(categories: NewsCategory[]): void {
    this.categories.set(categories);
    if (!this.form.categoryID && categories[0]) this.form.categoryID = categories[0].categoryID;
  }
  setForm(form: NewsFormValue): void { this.form = form; }
  setSaving(saving: boolean): void { this.saving.set(saving); }
  navigateToIndex(): void { this.router.navigate(['/cms/news']); }
}
