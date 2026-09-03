import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * linkifyText escapes its input, auto-links bare URLs / domains, converts
 * newlines to <br>, and returns SafeHtml. bypassSecurityTrustHtml is safe here
 * because linking happens on top of an already-escaped string — no raw HTML
 * from the source survives.
 */
@Pipe({ name: 'linkifyText', standalone: true })
export class LinkifyTextPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  private static readonly URL_RE =
    /((https?:\/\/|www\.)[^\s<]+|\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)+(?:\/[^\s<]*)?)/gi;

  transform(value: string | null | undefined): SafeHtml {
    const escaped = this.escape(value ?? '');
    const linked = escaped.replace(LinkifyTextPipe.URL_RE, (match) => {
      // Peel trailing punctuation back out of the anchor.
      const trailMatch = /[.,;:!?)\]}'"]+$/.exec(match);
      const trail = trailMatch ? trailMatch[0] : '';
      const core = trail ? match.slice(0, -trail.length) : match;
      const href = /^https?:\/\//i.test(core) ? core : `https://${core}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${core}</a>${trail}`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(linked.replace(/\n/g, '<br>'));
  }

  private escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
