import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthRepository } from '../../user/repositories/auth.repository';
import { ToastService } from '../../../core/services/toast.service';
import { UploadService } from '../../../core/services/upload.service';
import { CommentRepository } from '../repositories/comment.repository';
import { Comment, MediaType, MentionRef } from '../entities/comment';
import { IconComponent } from '../../../shared/icon.component';
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
  imports: [FormsModule, RouterLink, IconComponent, CommentItemComponent, GifPickerComponent, MentionTextareaComponent],
  template: `
    <section class="cmt-section" id="cmt-section">
      <div class="cmt-section-head">
        <span class="eyebrow"><app-icon name="comments" [size]="13" /> Diskusi</span>
        <h3 class="cmt-section-title">
          Komentar
          @if (!loading() && comments().length > 0) { <span class="cmt-count">({{ comments().length }})</span> }
        </h3>
      </div>

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
          <app-gif-picker [open]="gifOpen()" (select)="onGifSelected($event)" (close)="gifOpen.set(false)" />
        </div>
      } @else {
        <div class="cmt-guest-cta">
          <span class="icon-badge lg icon-badge-soft"><app-icon name="comment-slash" [size]="20" /></span>
          <p class="cmt-guest-title">Bergabung dalam Diskusi</p>
          <p class="cmt-guest-desc">Masuk untuk berbagi pendapat, bertanya, atau menanggapi komentar lainnya.</p>
          <a [routerLink]="['/login']" [queryParams]="{ returnUrl }" class="btn btn-primary">
            <app-icon name="log-in" [size]="14" /> Masuk untuk Berkomentar
          </a>
        </div>
      }

      @if (loading()) {
        <div class="cmt-loading">
          <span class="skel skel-line" style="width:70%;height:16px"></span>
          <span class="skel skel-line" style="width:45%;height:16px"></span>
        </div>
      } @else {
        <div class="cmt-list">
          @for (c of comments(); track c.commentID) {
            <app-comment-item [comment]="c" [level]="0" (removed)="onCommentRemoved($event)" />
          } @empty {
            <div class="cmt-empty">
              <span class="icon-badge lg icon-badge-neutral"><app-icon name="comments" [size]="22" /></span>
              <p class="cmt-empty-title">Belum Ada Komentar</p>
              <p class="cmt-empty-desc">Jadilah yang pertama memberikan tanggapan.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .cmt-section { margin-top: 40px; padding-top: 32px; border-top: 1px solid var(--color-border); }
    .cmt-section-head { margin-bottom: 20px; }
    .cmt-section-head .eyebrow { display: block; margin-bottom: 6px; }
    .cmt-section-title { margin: 0; }
    .cmt-count { color: var(--color-muted); font-weight: 600; font-size: .85em; }

    .cmt-compose { margin-bottom: 24px; }
    .cmt-compose-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
    .cmt-compose-actions .grow { flex: 1; }
    .cmt-media-preview { position: relative; display: inline-block; margin-top: 8px; }
    .cmt-media-preview img { max-width: 160px; max-height: 160px; border-radius: var(--radius-md); display: block; }
    .cmt-media-preview .link-danger { display: block; margin-top: 4px; font-size: .8rem; }

    /* Ajakan masuk untuk tamu — dulu kotak abu-abu polos, sekarang kartu
       gradien hijau lembut + icon-badge + CTA lebih jelas, konsisten dengan
       empty-state bergaya di halaman lain (bukan kotak flat tanpa aksen). */
    .cmt-guest-cta {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 32px 24px; margin-bottom: 24px; border-radius: var(--radius-lg);
      background: linear-gradient(160deg, var(--color-primary-tint) 0%, var(--color-primary-soft) 100%);
      border: 1px solid var(--color-primary-soft);
    }
    .cmt-guest-cta .icon-badge { margin-bottom: 12px; }
    .cmt-guest-title { margin: 0; font-weight: 800; font-size: 1.05rem; color: var(--color-text); }
    .cmt-guest-desc { margin: 6px 0 20px; color: var(--color-text-secondary); font-size: .9rem; max-width: 360px; }
    .cmt-guest-cta .btn { display: inline-flex; align-items: center; gap: 8px; }

    .cmt-loading { display: flex; flex-direction: column; gap: 10px; padding: 8px 0 20px; }

    /* Empty state daftar komentar — identik pola empty-state bergaya lain
       (Galeri/Berita): icon-badge + judul + deskripsi, bukan teks polos
       di tengah ruang kosong. */
    .cmt-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 20px; }
    .cmt-empty .icon-badge { margin-bottom: 12px; }
    .cmt-empty-title { margin: 0; font-weight: 700; color: var(--color-text); }
    .cmt-empty-desc { margin: 4px 0 0; color: var(--color-muted); font-size: .88rem; }
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
