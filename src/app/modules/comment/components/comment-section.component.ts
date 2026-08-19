import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../user/repositories/auth.repository';
import { ToastService } from '../../../core/services/toast.service';
import { UploadService } from '../../../core/services/upload.service';
import { CommentRepository } from '../repositories/comment.repository';
import { Comment, MediaType, MentionRef } from '../entities/comment';
import { CommentItemComponent } from './comment-item.component';
import { GifPickerComponent } from './gif-picker.component';
import { MentionTextareaComponent } from './mention-textarea.component';

/**
 * Widget komentar publik yang di-embed di halaman detail Artikel & Berita
 * (cross-module import langsung dari modules/comment/components — lihat
 * techspec Comment System §13). `contentType` konstan per halaman pemanggil,
 * `contentID` dari data konten yang sedang dibuka.
 */
@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [FormsModule, RouterLink, CommentItemComponent, GifPickerComponent, MentionTextareaComponent],
  template: `
    <section class="cmt-section" id="cmt-section">
      <h3 class="cmt-section-title">Komentar</h3>

      @if (isLoggedIn()) {
        <div class="cmt-compose">
          <app-mention-textarea [rows]="3" placeholder="Tulis komentar… (Ctrl+Enter untuk kirim)" [(ngModel)]="text" [initialMentions]="mentions" (mentionsChange)="mentions = $event" (ctrlEnter)="submit()" />
          @if (media) {
            <div class="cmt-media-preview">
              <img [src]="media.url" [alt]="media.type">
              <span class="link-danger" (click)="media = null">Hapus media</span>
            </div>
          }
          <div class="cmt-compose-actions">
            <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="onFileSelected($event)">
            <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()" [disabled]="uploading()">🖼️ Gambar</button>
            <button type="button" class="btn btn-outline btn-sm" (click)="gifOpen.set(true)">🎞️ GIF</button>
            <span class="grow"></span>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="submitting()" (click)="submit()">Kirim</button>
          </div>
          @if (gifOpen()) {
            <app-gif-picker (select)="onGifSelected($event)" (close)="gifOpen.set(false)" />
          }
        </div>
      } @else {
        <div class="cmt-guest-cta">
          <p>Masuk untuk ikut berkomentar.</p>
          <a [routerLink]="['/login']" [queryParams]="{ returnUrl }" class="btn btn-primary btn-sm">Masuk untuk berkomentar</a>
        </div>
      }

      @if (loading()) {
        <p class="text-muted cmt-loading">Memuat komentar…</p>
      } @else {
        <div class="cmt-list">
          @for (c of comments(); track c.commentID) {
            <app-comment-item [comment]="c" [level]="0" (removed)="onCommentRemoved($event)" />
          } @empty {
            <p class="text-muted">Belum ada komentar. Jadilah yang pertama!</p>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .cmt-section { margin-top: 40px; padding-top: 32px; border-top: 1px solid var(--color-border); }
    .cmt-section-title { margin-bottom: 16px; }
    .cmt-compose { margin-bottom: 24px; }
    .cmt-compose-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
    .cmt-compose-actions .grow { flex: 1; }
    .cmt-media-preview { position: relative; display: inline-block; margin-top: 8px; }
    .cmt-media-preview img { max-width: 160px; max-height: 160px; border-radius: var(--radius-md); display: block; }
    .cmt-media-preview .link-danger { display: block; margin-top: 4px; font-size: .8rem; }
    .cmt-guest-cta { padding: 20px; text-align: center; background: var(--color-bg-warm); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: 24px; }
    .cmt-guest-cta p { margin: 0 0 12px; color: var(--color-text-secondary); }
    .cmt-loading { padding: 20px 0; }
  `],
})
export class CommentSectionComponent implements OnInit {
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);
  private uploadService = inject(UploadService);
  private commentRepo = inject(CommentRepository);
  private router = inject(Router);

  @Input({ required: true }) contentType!: string;
  @Input({ required: true }) contentID!: number;

  comments = signal<Comment[]>([]);
  loading = signal(true);

  text = '';
  media: { url: string; type: MediaType } | null = null;
  mentions: MentionRef[] = [];
  uploading = signal(false);
  gifOpen = signal(false);
  submitting = signal(false);

  isLoggedIn = this.auth.isLoggedIn;

  get returnUrl(): string { return `${this.router.url}#cmt-section`; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.commentRepo.publicList(this.contentType, this.contentID).subscribe({
      next: (data) => { this.comments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    this.uploading.set(true);
    this.uploadService.uploadImage(file).subscribe({
      next: (res) => { this.media = { url: res.url, type: 'image' }; this.uploading.set(false); },
      error: () => this.uploading.set(false),
    });
  }

  onGifSelected(m: { url: string; type: MediaType }): void { this.media = m; this.gifOpen.set(false); }

  submit(): void {
    if (this.submitting()) return;
    if (!this.text.trim() && !this.media) { this.toast.error('Komentar atau media wajib diisi'); return; }
    this.submitting.set(true);
    this.commentRepo.create({
      contentType: this.contentType,
      contentID: this.contentID,
      commentText: this.text.trim(),
      mediaURL: this.media?.url,
      mediaType: this.media?.type,
      mentionedUserIDs: this.mentions.map((m) => m.userID),
    }).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.text = '';
        this.media = null;
        this.mentions = [];
        // Backend mengurutkan thread ASC berdasarkan createdDate — tambahkan
        // di akhir daftar lokal supaya urutannya tetap konsisten tanpa reload.
        this.comments.update((list) => [...list, created]);
      },
      error: () => this.submitting.set(false),
    });
  }

  onCommentRemoved(commentID: number): void {
    this.comments.update((list) => list.filter((c) => c.commentID !== commentID));
  }
}
