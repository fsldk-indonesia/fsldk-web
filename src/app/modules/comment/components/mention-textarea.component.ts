import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { UserRepository } from '../../user/repositories/user.repository';
import { MentionUser } from '../../user/entities/user';
import { MentionRef } from '../entities/comment';

/**
 * Drop-in pengganti <textarea> yang mendukung @mention: mengetik "@" diikuti
 * teks memicu pencarian pengguna (GET /users/mention-search), memilih salah
 * satu menyisipkan "@Nama Lengkap " polos (tanpa tanda kurung kurawal — itu
 * cuma notasi dokumentasi) di posisi kursor. Mention yang benar-benar dipilih
 * dilacak terpisah (bukan di-parse ulang dari teks, yang ambigu) dan
 * dipancarkan lewat `mentionsChange` — komponen pemanggil mengirim daftar
 * userID itu sebagai `mentionedUserIDs` saat submit, dan pill di tampilan
 * komentar (MentionHighlightPipe) dirender dari daftar terkonfirmasi ini,
 * bukan dari pola teks. Mengimplementasikan ControlValueAccessor supaya
 * tetap bisa dipakai persis seperti <textarea> lewat [(ngModel)].
 */
@Component({
  selector: 'app-mention-textarea',
  standalone: true,
  imports: [],
  template: `
    <div class="mnt-wrap">
      @if (suggestions().length) {
        <ul class="mnt-suggest">
          @for (u of suggestions(); track u.userID; let i = $index) {
            <li [class.active]="i === activeIndex()">
              <button type="button" (mousedown)="onPickMouseDown($event, u)">
                @if (u.photoURL) { <img [src]="u.photoURL" alt=""> } @else { <span class="mnt-avatar">{{ u.fullName.charAt(0) }}</span> }
                {{ u.fullName }}
              </button>
            </li>
          }
        </ul>
      }
      <textarea #ta class="form-control" [rows]="rows" [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (blur)="onBlur()"
      ></textarea>
    </div>
  `,
  styles: [`
    .mnt-wrap { position: relative; }
    .mnt-suggest { position: absolute; bottom: 100%; left: 0; z-index: 40; margin: 0 0 4px; padding: 4px; list-style: none;
      min-width: 220px; max-width: 100%; max-height: 220px; overflow-y: auto; background: #fff; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg); }
    .mnt-suggest li { display: block; }
    .mnt-suggest button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 10px; border: none;
      background: none; border-radius: var(--radius-sm, 4px); cursor: pointer; font-size: .85rem; text-align: left;
      font-family: inherit; color: inherit; }
    .mnt-suggest li:hover button, .mnt-suggest li.active button { background: var(--color-bg-alt); }
    .mnt-suggest img { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .mnt-avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--color-primary-soft); color: var(--color-primary-dark);
      display: inline-flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MentionTextareaComponent), multi: true }],
})
export class MentionTextareaComponent implements ControlValueAccessor {
  private userRepo = inject(UserRepository);

  @Input() rows = 3;
  @Input() placeholder = '';
  /** Setara (keydown.control.enter) pada <textarea> biasa — dipancarkan di sini
   *  karena shortcut-nya harus tetap berfungsi walau saran mention sedang tertutup. */
  @Output() ctrlEnter = new EventEmitter<void>();
  /** Daftar mention yang sedang "aktif" di teks saat ini (bertambah saat
   *  memilih saran, berkurang otomatis kalau teks "@Nama"-nya dihapus/diubah). */
  @Output() mentionsChange = new EventEmitter<MentionRef[]>();

  /** Mention yang harus dianggap sudah terkonfirmasi sejak awal (mis. saat
   *  membuka mode edit komentar yang sudah punya mention) — di-seed ke state
   *  internal setiap kali reference array-nya berubah. */
  @Input() set initialMentions(refs: MentionRef[] | null | undefined) {
    this.confirmedMentions = refs ? [...refs] : [];
  }

  @ViewChild('ta') private taRef!: ElementRef<HTMLTextAreaElement>;

  value = '';
  suggestions = signal<MentionUser[]>([]);
  activeIndex = signal(0);

  private confirmedMentions: MentionRef[] = [];
  /** Index karakter '@' dari mention yang sedang diketik; -1 = tidak sedang mengetik mention. */
  private mentionStart = -1;
  private query$ = new Subject<string>();

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.query$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.userRepo.searchMentionable(q)),
      )
      .subscribe((users) => {
        this.suggestions.set(users);
        this.activeIndex.set(0);
      });
  }

  writeValue(v: string): void {
    this.value = v ?? '';
    this.closeSuggestions();
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.value = el.value;
    this.onChange(this.value);
    this.detectMention(el);
    this.reconcileMentions();
  }

  onBlur(): void {
    this.onTouched();
    this.closeSuggestions();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.suggestions().length) {
      if (event.key === 'ArrowDown') { event.preventDefault(); this.activeIndex.update((i) => Math.min(i + 1, this.suggestions().length - 1)); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); this.activeIndex.update((i) => Math.max(i - 1, 0)); return; }
      if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); this.pick(this.suggestions()[this.activeIndex()]); return; }
      if (event.key === 'Escape') { this.closeSuggestions(); return; }
    }
    if (event.key === 'Enter' && event.ctrlKey) { this.ctrlEnter.emit(); }
  }

  /** preventDefault on mousedown (not click) keeps the textarea focused —
   *  a <button> is natively focusable, so a plain click would blur the
   *  textarea before the pick even registers. */
  onPickMouseDown(event: MouseEvent, user: MentionUser): void {
    event.preventDefault();
    this.pick(user);
  }

  private pick(user: MentionUser): void {
    if (!user || this.mentionStart < 0) return;
    const el = this.taRef.nativeElement;
    const cursor = el.selectionStart ?? this.value.length;
    const token = `@${user.fullName} `;
    this.value = this.value.slice(0, this.mentionStart) + token + this.value.slice(cursor);
    this.onChange(this.value);
    if (!this.confirmedMentions.some((m) => m.userID === user.userID)) {
      this.confirmedMentions = [...this.confirmedMentions, { userID: user.userID, fullName: user.fullName }];
    }
    this.mentionsChange.emit(this.confirmedMentions);
    this.closeSuggestions();
    const pos = this.mentionStart + token.length;
    queueMicrotask(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  /** Cari pola "@query" tepat sebelum kursor (didahului awal teks/spasi) untuk memicu pencarian. */
  private detectMention(el: HTMLTextAreaElement): void {
    const cursor = el.selectionStart ?? this.value.length;
    const upToCursor = this.value.slice(0, cursor);
    const match = /(?:^|\s)@([^\s@]{0,50})$/.exec(upToCursor);
    if (!match) { this.closeSuggestions(); return; }
    this.mentionStart = cursor - match[1].length - 1;
    this.query$.next(match[1]);
  }

  /** Drop any confirmed mention whose "@Full Name" text is no longer present
   *  (user deleted/edited it away) and emit the updated list. */
  private reconcileMentions(): void {
    const next = this.confirmedMentions.filter((m) => this.mentionStillPresent(m.fullName));
    if (next.length !== this.confirmedMentions.length) {
      this.confirmedMentions = next;
      this.mentionsChange.emit(this.confirmedMentions);
    }
  }

  private mentionStillPresent(fullName: string): boolean {
    const escaped = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\s)@${escaped}(?=\\s|$)`).test(this.value);
  }

  private closeSuggestions(): void {
    this.suggestions.set([]);
    this.mentionStart = -1;
  }
}
