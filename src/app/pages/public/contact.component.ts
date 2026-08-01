import { Component, OnInit, inject, signal } from '@angular/core';
import { ContentService } from '../../core/services/data.services';

@Component({
  selector: 'app-contact',
  standalone: true,
  template: `
    <section class="section">
      <div class="container narrow text-center">
        <span class="eyebrow">Kontak</span>
        <h1>Hubungi FSLDK Indonesia</h1>
        <p class="text-muted">Sampaikan pertanyaan, kolaborasi, atau silaturahmi bersama kami.</p>
        <div class="grid grid-2 mt-lg">
          <div class="card card-pad">
            <h3>Email</h3>
            <p><a [href]="'mailto:' + email()">{{ email() }}</a></p>
          </div>
          <div class="card card-pad">
            <h3>Instagram</h3>
            <p><a [href]="'https://instagram.com/' + ig()" target="_blank" rel="noopener">&#64;{{ ig() }}</a></p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`.narrow { max-width: 760px; } h3 { margin-bottom: 8px; }`],
})
export class ContactComponent implements OnInit {
  private contentSvc = inject(ContentService);
  private c = signal<Record<string, string>>({});
  ngOnInit(): void { this.contentSvc.profile().subscribe({ next: (c) => this.c.set(c), error: () => {} }); }
  email(): string { return this.c()['contact.email'] || 'info@fsldk-indonesia.com'; }
  ig(): string { return this.c()['contact.instagram'] || 'fsldkindonesia'; }
}
