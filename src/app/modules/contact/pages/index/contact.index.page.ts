import { Component, OnInit, inject, signal } from '@angular/core';
import { ContactIndexPresenter } from './contact.index.presenter';
import { ContactIndexView } from './contact.index.view';

@Component({
  selector: 'app-contact-index-page',
  standalone: true,
  templateUrl: './contact.index.page.html',
  providers: [ContactIndexPresenter],
  styles: [`.narrow { max-width: 760px; } h3 { margin-bottom: 8px; }`],
})
export class ContactIndexPage implements OnInit, ContactIndexView {
  private presenter = inject(ContactIndexPresenter);
  private c = signal<Record<string, string>>({});

  ngOnInit(): void { this.presenter.attachView(this); this.presenter.load(); }

  email(): string { return this.c()['contact.email'] || 'info@fsldk-indonesia.com'; }
  ig(): string { return this.c()['contact.instagram'] || 'fsldkindonesia'; }

  setContent(content: Record<string, string>): void { this.c.set(content); }
}
