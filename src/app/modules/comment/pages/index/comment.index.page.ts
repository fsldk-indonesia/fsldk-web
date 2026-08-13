import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Comment } from '../../entities/comment';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent } from '../../../../shared/select.component';
import { CONTENT_TYPE_OPTIONS } from '../../comment.constants';
import { CommentIndexPresenter } from './comment.index.presenter';
import { CommentIndexView } from './comment.index.view';

@Component({
  selector: 'app-comment-index-page',
  standalone: true,
  templateUrl: './comment.index.page.html',
  imports: [RouterLink, DatePipe, SlicePipe, FormsModule, IconComponent, PaginationComponent, SelectComponent],
  providers: [CommentIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; } .grow { flex: 1; }`],
})
export class CommentIndexPage implements OnInit, CommentIndexView {
  private presenter = inject(CommentIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  readonly contentTypeOptions = CONTENT_TYPE_OPTIONS;

  comments = signal<Comment[]>([]);
  loading = signal(true);
  search = '';
  contentType = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 20;
  selected = new Set<number>();

  canDelete = this.auth.hasPermission('comment.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.contentType, this.search); }
  applySearch(): void { this.page.set(1); this.load(); }
  filterContentType(v: unknown): void { this.contentType = (v as string) ?? ''; this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  toggleSelect(id: number, checked: boolean): void {
    if (checked) this.selected.add(id); else this.selected.delete(id);
  }
  isSelected(id: number): boolean { return this.selected.has(id); }

  async remove(c: Comment, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus komentar dari "${c.author.name}"? Balasan & reaksi ikut terhapus.`, {
      title: 'Hapus Komentar', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.remove(c.commentID);
  }

  async bulkDelete(event?: Event): Promise<void> {
    if (this.selected.size === 0) return;
    const ok = await this.alert.confirm(`Hapus ${this.selected.size} komentar terpilih? Balasan & reaksi ikut terhapus.`, {
      title: 'Hapus Komentar Terpilih', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.bulkDelete([...this.selected]);
  }

  setComments(comments: Comment[], count: number): void {
    this.comments.set(comments);
    this.count.set(count);
    this.loading.set(false);
    this.selected.clear();
  }
  onRemoveSuccess(): void { this.load(); }
  onBulkDeleteSuccess(): void { this.load(); }
}
