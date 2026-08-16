import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../user/repositories/auth.repository';
import { ToastService } from '../../../core/services/toast.service';
import { UploadService } from '../../../core/services/upload.service';
import { AlertService } from '../../../core/services/alert.service';
import { CommentRepository } from '../repositories/comment.repository';
import { Comment, MediaType, MentionRef, ReactionType } from '../entities/comment';
import { REACTIONS } from '../comment.constants';
import { MentionHighlightPipe } from '../mention-highlight.pipe';
import { GifPickerComponent } from './gif-picker.component';
import { MentionTextareaComponent } from './mention-textarea.component';

/**
 * Satu komentar + rekursi balasannya (maks 1 level — tidak bisa membalas
 * balasan, ditegakkan juga di server — lihat comment_service.Create).
 * Reply/edit/react semuanya
 * ditangani secara LOKAL — API selalu mengembalikan data lengkap komentar
 * yang bersangkutan, jadi hasilnya diterapkan langsung ke state komponen
 * (push ke `comment.replies`, atau timpa field `comment` untuk edit/react)
 * tanpa reload seluruh thread. Hanya delete yang perlu memberi tahu induk
 * (lewat `removed`, membawa commentID) — karena instance INI tidak memegang
 * array yang berisi dirinya sendiri, hanya induknya yang bisa
 * menghapusnya dari `comment.replies`.
 */
@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [FormsModule, DatePipe, GifPickerComponent, CommentItemComponent, MentionTextareaComponent, MentionHighlightPipe],
  template: `
    <div class="cmt" [class.cmt-nested]="level > 0">
      <div class="cmt-avatar">
        @if (comment.author.photo) {
          <img class="avatar" [src]="comment.author.photo" [alt]="comment.author.name">
        } @else {
          <span class="avatar">{{ comment.author.name.charAt(0) }}</span>
        }
      </div>
      <div class="cmt-body">
        <div class="cmt-head">
          <strong>{{ comment.author.name }}</strong>
          <span class="cmt-time">{{ comment.createdDate | date:'d MMM yyyy, HH:mm' }}</span>
        </div>

        @if (!editing()) {
          @if (comment.commentText) { <p class="cmt-text" [innerHTML]="comment.commentText | mentionHighlight:comment.mentions"></p> }
          @if (comment.mediaURL) { <img class="cmt-media" [src]="comment.mediaURL" [alt]="comment.mediaType"> }

          <div class="cmt-actions">
            <span class="cmt-react-trigger" #reactWrap (click)="toggleReactionPicker()">
              React
              @if (reactionPickerOpen()) {
                <div class="cmt-reaction-picker" (click)="$event.stopPropagation()">
                  @for (r of reactions; track r.type) {
                    <span class="cmt-reaction-option" (click)="react(r.type)" [title]="r.label">{{ r.emoji }}</span>
                  }
                </div>
              }
            </span>
            @if (canReply) { <span class="link-action" (click)="openReply()">Balas</span> }
            @if (canEdit) { <span class="link-action" (click)="openEdit()">Edit</span> }
            @if (canDelete) { <span class="link-danger" (click)="remove($event)">Hapus</span> }
          </div>

          @if (activeReactionTypes().length) {
            <div class="cmt-reactions">
              @for (type of activeReactionTypes(); track type) {
                <span class="cmt-reaction-pill" [class.active]="isActive(type)" (click)="react(type)">
                  {{ reactionEmoji(type) }} {{ countFor(type) }}
                </span>
              }
            </div>
          }
        } @else {
          <app-mention-textarea [rows]="3" placeholder="Ubah komentar…" [(ngModel)]="editText" [initialMentions]="editMentions" (mentionsChange)="editMentions = $event" (ctrlEnter)="submitEdit()" />
          @if (editMedia) {
            <div class="cmt-media-preview">
              <img [src]="editMedia.url" [alt]="editMedia.type">
              <span class="link-danger" (click)="editMedia = null">Hapus media</span>
            </div>
          }
          <div class="cmt-compose-actions">
            <input #editFile type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="onEditFileSelected($event)">
            <button type="button" class="btn btn-outline btn-sm" (click)="editFile.click()" [disabled]="editUploading()">🖼️ Gambar</button>
            <button type="button" class="btn btn-outline btn-sm" (click)="editGifOpen.set(true)">🎞️ GIF</button>
            <span class="grow"></span>
            <button type="button" class="btn btn-ghost btn-sm" (click)="cancelEdit()">Batal</button>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="editSubmitting()" (click)="submitEdit()">Simpan</button>
          </div>
          @if (editGifOpen()) {
            <app-gif-picker (select)="onEditGifSelected($event)" (close)="editGifOpen.set(false)" />
          }
        }

        @if (replying()) {
          <div class="cmt-reply-form">
            <app-mention-textarea [rows]="2" placeholder="Tulis balasan… (Ctrl+Enter untuk kirim)" [(ngModel)]="replyText" [initialMentions]="replyMentions" (mentionsChange)="replyMentions = $event" (ctrlEnter)="submitReply()" />
            @if (replyMedia) {
              <div class="cmt-media-preview">
                <img [src]="replyMedia.url" [alt]="replyMedia.type">
                <span class="link-danger" (click)="replyMedia = null">Hapus media</span>
              </div>
            }
            <div class="cmt-compose-actions">
              <input #replyFile type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="onReplyFileSelected($event)">
              <button type="button" class="btn btn-outline btn-sm" (click)="replyFile.click()" [disabled]="replyUploading()">🖼️ Gambar</button>
              <button type="button" class="btn btn-outline btn-sm" (click)="replyGifOpen.set(true)">🎞️ GIF</button>
              <span class="grow"></span>
              <button type="button" class="btn btn-ghost btn-sm" (click)="cancelReply()">Batal</button>
              <button type="button" class="btn btn-primary btn-sm" [disabled]="replySubmitting()" (click)="submitReply()">Kirim</button>
            </div>
            @if (replyGifOpen()) {
              <app-gif-picker (select)="onReplyGifSelected($event)" (close)="replyGifOpen.set(false)" />
            }
          </div>
        }

        @if (comment.replies.length) {
          <div class="cmt-replies">
            @for (r of comment.replies; track r.commentID) {
              <app-comment-item [comment]="r" [level]="level + 1" (removed)="onReplyRemoved($event)" />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cmt { display: flex; gap: 12px; padding: 16px 0; border-top: 1px solid var(--color-border); }
    .cmt:first-child { border-top: none; padding-top: 0; }
    .cmt-nested { padding: 12px 0; }
    .cmt-body { flex: 1; min-width: 0; }
    .cmt-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .cmt-time { color: var(--color-muted); font-size: .82rem; }
    .cmt-text { margin: 0 0 8px; white-space: pre-wrap; word-break: break-word; }
    .cmt-text ::ng-deep .mention-pill { display: inline-flex; align-items: center; background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 600; line-height: 1.5; padding: 3px 10px; border-radius: var(--radius-full); vertical-align: middle; }
    .cmt-media { max-width: 260px; max-height: 260px; border-radius: var(--radius-md); display: block; margin-bottom: 8px; }
    .cmt-actions { display: flex; align-items: center; gap: 14px; font-size: .85rem; margin-bottom: 6px; }
    .cmt-react-trigger { position: relative; cursor: pointer; font-weight: 600; color: var(--color-primary-dark); }
    .cmt-reaction-picker { position: absolute; top: calc(100% + 8px); left: 0; z-index: 30; display: flex; gap: 4px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-full); padding: 6px 8px; box-shadow: var(--shadow-lg); white-space: nowrap; }
    .cmt-reaction-option { cursor: pointer; font-size: 1.1rem; transition: transform var(--motion-fast) ease; display: inline-block; }
    .cmt-reaction-option:hover { transform: scale(1.25); }
    .cmt-reactions { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
    .cmt-reaction-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: var(--radius-full); background: var(--color-bg-alt); font-size: .82rem; cursor: pointer; }
    .cmt-reaction-pill.active { background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 600; }
    .cmt-reply-form, .cmt-compose-actions { margin-top: 10px; }
    .cmt-compose-actions { display: flex; align-items: center; gap: 8px; }
    .cmt-compose-actions .grow { flex: 1; }
    .cmt-media-preview { position: relative; display: inline-block; margin-top: 8px; }
    .cmt-media-preview img { max-width: 160px; max-height: 160px; border-radius: var(--radius-md); display: block; }
    .cmt-media-preview .link-danger { display: block; margin-top: 4px; font-size: .8rem; }
    .cmt-replies { margin-top: 8px; padding-left: 20px; border-left: 2px solid var(--color-border); }
  `],
})
export class CommentItemComponent implements OnDestroy {
  private auth = inject(AuthRepository);
  private toast = inject(ToastService);
  private uploadService = inject(UploadService);
  private commentRepo = inject(CommentRepository);
  private alert = inject(AlertService);

  @Input({ required: true }) comment!: Comment;
  @Input() level = 0;
  /** Memancarkan commentID komentar yang baru dihapus — hanya untuk delete,
   *  karena instance ini tidak memegang array yang berisi dirinya sendiri;
   *  induk (comment-item induk atau comment-section) yang menghapusnya dari
   *  `comment.replies`/daftar top-level. Create/edit/react ditangani lokal
   *  di sini langsung, tidak perlu memberi tahu siapa pun. */
  @Output() removed = new EventEmitter<number>();

  @ViewChild('reactWrap') reactWrapRef?: ElementRef<HTMLElement>;

  readonly reactions = REACTIONS;
  canModerateDelete = this.auth.hasPermission('comment.delete');
  canModerateEdit = this.auth.hasPermission('comment.update');

  replying = signal(false);
  replyText = '';
  replyMedia: { url: string; type: MediaType } | null = null;
  replyMentions: MentionRef[] = [];
  replyUploading = signal(false);
  replyGifOpen = signal(false);
  replySubmitting = signal(false);

  editing = signal(false);
  editText = '';
  editMedia: { url: string; type: MediaType } | null = null;
  editMentions: MentionRef[] = [];
  editUploading = signal(false);
  editGifOpen = signal(false);
  editSubmitting = signal(false);

  reactionPickerOpen = signal(false);

  // Getters (bukan field diinisialisasi sekali) karena `level`/`comment` di-set
  // Angular lewat @Input SETELAH constructor selesai — field initializer akan
  // membaca nilai default (level=0), bukan nilai yang benar-benar di-bind.
  get canReply(): boolean { return this.level < 1; }
  get canEdit(): boolean { return this.comment.isOwner || this.canModerateEdit; }
  get canDelete(): boolean { return this.comment.isOwner || this.canModerateDelete; }

  /**
   * Tutup picker reaksi saat klik di luar area trigger+picker-nya (capture
   * phase, sama seperti pola SelectComponent — supaya tetap konsisten
   * tertutup meski ada ancestor modal yang memanggil stopPropagation()
   * pada bubble phase-nya sendiri).
   */
  private onDocumentClick = (event: MouseEvent): void => {
    if (!this.reactionPickerOpen()) return;
    const wrap = this.reactWrapRef?.nativeElement;
    if (wrap && !wrap.contains(event.target as Node)) this.reactionPickerOpen.set(false);
  };

  constructor() {
    document.addEventListener('click', this.onDocumentClick, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  activeReactionTypes(): ReactionType[] {
    const active = new Set(this.comment.reactions.userTypes ?? []);
    return this.reactions
      .filter((r) => (this.comment.reactions.counts[r.type] ?? 0) > 0 || active.has(r.type))
      .map((r) => r.type);
  }

  countFor(type: ReactionType): number { return this.comment.reactions.counts[type] ?? 0; }
  // `?? []` — defensive: the backend should always send an array (see
  // comment_service.toResponse), but this must never throw even if a future
  // code path slips through, since a thrown error mid-@for breaks rendering
  // for every pill after it (this was the root cause of a rendering bug —
  // .includes() on a null userTypes stopped the loop partway through).
  isActive(type: ReactionType): boolean { return (this.comment.reactions.userTypes ?? []).includes(type); }
  reactionEmoji(type: ReactionType): string { return this.reactions.find((r) => r.type === type)?.emoji ?? ''; }

  toggleReactionPicker(): void {
    if (!this.auth.isLoggedIn()) { this.toast.error('Masuk untuk memberi reaksi'); return; }
    this.reactionPickerOpen.update((v) => !v);
  }

  /** Toggle reaksi — response berisi counts/userTypes terbaru, diterapkan
   *  langsung ke comment.reactions supaya UI ter-update seketika tanpa
   *  reload seluruh thread. */
  react(type: ReactionType): void {
    this.reactionPickerOpen.set(false);
    this.commentRepo.react(this.comment.commentID, type).subscribe({
      next: (result) => { this.comment.reactions = result; },
      error: () => {},
    });
  }

  openReply(): void {
    if (!this.auth.isLoggedIn()) { this.toast.error('Masuk untuk membalas komentar'); return; }
    this.replying.set(true);
  }
  cancelReply(): void { this.replying.set(false); this.replyText = ''; this.replyMedia = null; this.replyMentions = []; }

  onReplyFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    this.replyUploading.set(true);
    this.uploadService.uploadImage(file).subscribe({
      next: (res) => { this.replyMedia = { url: res.url, type: 'image' }; this.replyUploading.set(false); },
      error: () => this.replyUploading.set(false),
    });
  }
  onReplyGifSelected(m: { url: string; type: MediaType }): void { this.replyMedia = m; this.replyGifOpen.set(false); }

  submitReply(): void {
    if (this.replySubmitting()) return;
    if (!this.replyText.trim() && !this.replyMedia) { this.toast.error('Komentar atau media wajib diisi'); return; }
    this.replySubmitting.set(true);
    this.commentRepo.create({
      contentType: this.comment.contentType,
      contentID: this.comment.contentID,
      parentID: this.comment.commentID,
      commentText: this.replyText.trim(),
      mediaURL: this.replyMedia?.url,
      mediaType: this.replyMedia?.type,
      mentionedUserIDs: this.replyMentions.map((m) => m.userID),
    }).subscribe({
      next: (created) => {
        this.replySubmitting.set(false);
        this.comment.replies = [...this.comment.replies, created];
        this.cancelReply();
      },
      error: () => this.replySubmitting.set(false),
    });
  }

  onReplyRemoved(commentID: number): void {
    this.comment.replies = this.comment.replies.filter((r) => r.commentID !== commentID);
  }

  openEdit(): void {
    this.editText = this.comment.commentText;
    this.editMedia = this.comment.mediaURL ? { url: this.comment.mediaURL, type: this.comment.mediaType ?? 'image' } : null;
    this.editMentions = (this.comment.mentions ?? []).map((m) => ({ userID: m.userID, fullName: m.name }));
    this.editing.set(true);
  }
  cancelEdit(): void { this.editing.set(false); }

  onEditFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    this.editUploading.set(true);
    this.uploadService.uploadImage(file).subscribe({
      next: (res) => { this.editMedia = { url: res.url, type: 'image' }; this.editUploading.set(false); },
      error: () => this.editUploading.set(false),
    });
  }
  onEditGifSelected(m: { url: string; type: MediaType }): void { this.editMedia = m; this.editGifOpen.set(false); }

  submitEdit(): void {
    if (this.editSubmitting()) return;
    if (!this.editText.trim() && !this.editMedia) { this.toast.error('Komentar atau media wajib diisi'); return; }
    this.editSubmitting.set(true);
    this.commentRepo.update(this.comment.commentID, {
      commentText: this.editText.trim(),
      mediaURL: this.editMedia?.url,
      mediaType: this.editMedia?.type,
      mentionedUserIDs: this.editMentions.map((m) => m.userID),
    }).subscribe({
      next: (updated) => {
        this.editSubmitting.set(false);
        this.editing.set(false);
        // Server adalah sumber kebenaran (mis. media lama yang dibersihkan
        // di backend) — timpa seluruh field yang bisa berubah lewat edit,
        // bukan cuma yang dikirim di request.
        this.comment.commentText = updated.commentText;
        this.comment.mediaURL = updated.mediaURL;
        this.comment.mediaType = updated.mediaType;
        this.comment.mentions = updated.mentions;
      },
      error: () => this.editSubmitting.set(false),
    });
  }

  async remove(event?: Event): Promise<void> {
    const ok = await this.alert.confirm('Hapus komentar ini? Balasan & reaksi ikut terhapus.', {
      title: 'Hapus Komentar', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.commentRepo.remove(this.comment.commentID).subscribe({
      next: () => { this.toast.success('Komentar dihapus'); this.removed.emit(this.comment.commentID); },
      error: () => {},
    });
  }
}
