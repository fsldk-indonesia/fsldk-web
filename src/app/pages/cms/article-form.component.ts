import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../core/services/data.services';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Category } from '../../core/models/models';

@Component({
  selector: 'app-cms-article-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-head"><a routerLink="/cms/articles" class="back">← Kembali</a><h1>{{ editId ? 'Ubah Artikel' : 'Tambah Artikel' }}</h1></div>

    <div class="card card-pad form-card">
      <div class="form-group"><label class="form-label">Judul Artikel</label>
        <input class="form-control" [(ngModel)]="form.articleTitle" placeholder="Tulis judul artikel…"></div>

      <div class="grid grid-2">
        <div class="form-group"><label class="form-label">Kategori</label>
          <select class="form-control" [(ngModel)]="form.categoryID">
            @for (c of categories(); track c.categoryID) { <option [value]="c.categoryID">{{ c.categoryName }}</option> }
          </select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" [(ngModel)]="form.status" [disabled]="!canPublish">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          @if (!canPublish) { <p class="form-hint">Hanya Editor/Super Admin yang dapat mempublikasikan.</p> }
        </div>
      </div>

      <div class="form-group"><label class="form-label">Gambar Utama (URL)</label>
        <input class="form-control" [(ngModel)]="form.articleImage" placeholder="https://…"></div>
      <div class="form-group"><label class="form-label">Ringkasan</label>
        <input class="form-control" [(ngModel)]="form.articleExcerpt" placeholder="Ringkasan singkat…"></div>
      <div class="form-group"><label class="form-label">Konten</label>
        <textarea class="form-control" rows="12" [(ngModel)]="form.articleContent" placeholder="Isi artikel…"></textarea></div>

      <div class="flex gap justify-between">
        <a routerLink="/cms/articles" class="btn btn-ghost">Batal</a>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> } @else { Simpan Artikel }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-head { margin-bottom: 24px; } .back { display: inline-block; margin-bottom: 8px; color: var(--color-text-secondary); }
    .form-card { max-width: 820px; }
  `],
})
export class CmsArticleFormComponent implements OnInit {
  private articleSvc = inject(ArticleService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  categories = signal<Category[]>([]);
  saving = signal(false);
  editId: number | null = null;
  canPublish = this.auth.hasPermission('article.publish');
  form = { articleTitle: '', categoryID: 0, status: 'draft', articleImage: '', articleExcerpt: '', articleContent: '' };

  ngOnInit(): void {
    this.articleSvc.categories().subscribe({
      next: (c) => { this.categories.set(c); if (!this.form.categoryID && c[0]) this.form.categoryID = c[0].categoryID; },
      error: () => {},
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.articleSvc.cmsGet(this.editId).subscribe({
        next: (a) => this.form = {
          articleTitle: a.articleTitle, categoryID: a.categoryID, status: a.isPublished ? 'published' : 'draft',
          articleImage: a.articleImage ?? '', articleExcerpt: a.articleExcerpt ?? '', articleContent: a.articleContent,
        },
        error: () => {},
      });
    }
  }

  save(): void {
    if (!this.form.articleTitle || !this.form.articleContent) { this.toast.error('Judul dan konten wajib diisi'); return; }
    this.saving.set(true);
    const body = { ...this.form, categoryID: +this.form.categoryID };
    const done = () => { this.saving.set(false); this.toast.success('Artikel disimpan'); this.router.navigate(['/cms/articles']); };
    if (this.editId) {
      this.articleSvc.update(this.editId, body).subscribe({ next: done, error: () => this.saving.set(false) });
    } else {
      this.articleSvc.create(body).subscribe({ next: done, error: () => this.saving.set(false) });
    }
  }
}
