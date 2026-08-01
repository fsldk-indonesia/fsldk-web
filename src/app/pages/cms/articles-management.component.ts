import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ArticleService } from '../../core/services/data.services';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Article } from '../../core/models/models';

@Component({
  selector: 'app-cms-articles',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="flex justify-between items-center page-head">
      <div><h1>Manajemen Artikel</h1><p class="text-muted">Kelola artikel &amp; kajian organisasi.</p></div>
      @if (canCreate) { <a routerLink="/cms/articles/form" class="btn btn-primary">+ Tambah Artikel</a> }
    </div>

    <div class="card">
      <div class="card-pad flex gap">
        <span class="chip" [class.active]="status === ''" (click)="filter('')">Semua</span>
        <span class="chip" [class.active]="status === 'published'" (click)="filter('published')">Published</span>
        <span class="chip" [class.active]="status === 'draft'" (click)="filter('draft')">Draft</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Judul</th><th>Kategori</th><th>Status</th><th>Tanggal</th><th></th></tr></thead>
          <tbody>
            @for (a of articles(); track a.articleID) {
              <tr>
                <td><strong>{{ a.articleTitle }}</strong></td>
                <td class="text-muted">{{ a.categoryName }}</td>
                <td><span class="badge" [class.badge-published]="a.isPublished" [class.badge-draft]="!a.isPublished">{{ a.isPublished ? 'Published' : 'Draft' }}</span></td>
                <td class="text-muted">{{ a.createdDate | date:'d MMM yyyy' }}</td>
                <td>
                  <div class="table-actions">
                    @if (canUpdate) { <a class="link-action" [routerLink]="['/cms/articles/form', a.articleID]">Edit</a> }
                    @if (canPublish) { <span class="link-action" (click)="togglePublish(a)">{{ a.isPublished ? 'Tarik' : 'Publish' }}</span> }
                    @if (canDelete) { <span class="link-danger" (click)="remove(a)">Hapus</span> }
                  </div>
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="text-muted">Belum ada artikel.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class CmsArticlesComponent implements OnInit {
  private articleSvc = inject(ArticleService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  articles = signal<Article[]>([]);
  status = '';
  canCreate = this.auth.hasPermission('article.create');
  canUpdate = this.auth.hasPermission('article.update');
  canPublish = this.auth.hasPermission('article.publish');
  canDelete = this.auth.hasPermission('article.delete');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.articleSvc.cmsList({ page: 1, limit: 50, status: this.status }).subscribe({ next: (p) => this.articles.set(p.data), error: () => {} });
  }
  filter(s: string): void { this.status = s; this.load(); }

  togglePublish(a: Article): void {
    this.articleSvc.publish(a.articleID, !a.isPublished).subscribe({
      next: () => { this.toast.success(a.isPublished ? 'Publikasi ditarik' : 'Artikel dipublikasikan'); this.load(); },
      error: () => {},
    });
  }
  remove(a: Article): void {
    if (!confirm(`Hapus artikel "${a.articleTitle}"?`)) return;
    this.articleSvc.remove(a.articleID).subscribe({ next: () => { this.toast.success('Artikel dihapus'); this.load(); }, error: () => {} });
  }
}
