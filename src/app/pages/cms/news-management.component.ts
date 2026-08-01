import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NewsService } from '../../core/services/data.services';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { News } from '../../core/models/models';

@Component({
  selector: 'app-cms-news',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="flex justify-between items-center page-head">
      <div><h1>Manajemen Berita</h1><p class="text-muted">Kelola berita organisasi.</p></div>
      @if (canCreate) { <a routerLink="/cms/news/form" class="btn btn-primary">+ Tambah Berita</a> }
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
            @for (n of news(); track n.newsID) {
              <tr>
                <td><strong>{{ n.newsTitle }}</strong></td>
                <td class="text-muted">{{ n.categoryName }}</td>
                <td><span class="badge" [class.badge-published]="n.isPublished" [class.badge-draft]="!n.isPublished">{{ n.isPublished ? 'Published' : 'Draft' }}</span></td>
                <td class="text-muted">{{ n.createdDate | date:'d MMM yyyy' }}</td>
                <td>
                  <div class="table-actions">
                    @if (canUpdate) { <a class="link-action" [routerLink]="['/cms/news/form', n.newsID]">Edit</a> }
                    @if (canPublish) { <span class="link-action" (click)="togglePublish(n)">{{ n.isPublished ? 'Tarik' : 'Publish' }}</span> }
                    @if (canDelete) { <span class="link-danger" (click)="remove(n)">Hapus</span> }
                  </div>
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="text-muted">Belum ada berita.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class CmsNewsComponent implements OnInit {
  private newsSvc = inject(NewsService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  news = signal<News[]>([]);
  status = '';
  canCreate = this.auth.hasPermission('news.create');
  canUpdate = this.auth.hasPermission('news.update');
  canPublish = this.auth.hasPermission('news.publish');
  canDelete = this.auth.hasPermission('news.delete');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.newsSvc.cmsList({ page: 1, limit: 50, status: this.status }).subscribe({ next: (p) => this.news.set(p.data), error: () => {} });
  }
  filter(s: string): void { this.status = s; this.load(); }

  togglePublish(n: News): void {
    this.newsSvc.publish(n.newsID, !n.isPublished).subscribe({
      next: () => { this.toast.success(n.isPublished ? 'Publikasi ditarik' : 'Berita dipublikasikan'); this.load(); },
      error: () => {},
    });
  }
  remove(n: News): void {
    if (!confirm(`Hapus berita "${n.newsTitle}"?`)) return;
    this.newsSvc.remove(n.newsID).subscribe({ next: () => { this.toast.success('Berita dihapus'); this.load(); }, error: () => {} });
  }
}
