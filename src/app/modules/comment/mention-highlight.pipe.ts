import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommentAuthor } from './entities/comment';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders "@Full Name" as a highlighted pill for every name in `mentions` —
 * the comment's structured, server-confirmed mention list (see
 * comment_dto.Response.mentions), NOT a text pattern guessed from
 * commentText itself (freeform "@word" a user typed without picking from
 * the autocomplete never gets highlighted). Text is escaped BEFORE matching
 * mention names, and the names themselves are escaped the same way, so this
 * stays safe to bind via [innerHTML] regardless of what either contains.
 */
@Pipe({ name: 'mentionHighlight', standalone: true })
export class MentionHighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | null | undefined, mentions: CommentAuthor[] | null | undefined): SafeHtml {
    const escaped = escapeHtml(text ?? '');
    if (!mentions?.length) return this.sanitizer.bypassSecurityTrustHtml(escaped);

    // Longest names first so a shorter name that's a prefix of a longer one
    // (e.g. "Ahmad" vs "Ahmad Fadli") never shadows the longer match.
    const names = [...new Set(mentions.map((m) => m.name))]
      .sort((a, b) => b.length - a.length)
      .map((n) => escapeRegExp(escapeHtml(n)));
    const re = new RegExp(`@(${names.join('|')})(?=\\s|$|[.,!?;:])`, 'g');
    const html = escaped.replace(re, (_match, name: string) => `<span class="mention-pill">@${name}</span>`);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
