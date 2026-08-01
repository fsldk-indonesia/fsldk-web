import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ContentRepository } from '../../../content/repositories/content.repository';
import { ContactIndexView } from './contact.index.view';

@Injectable()
export class ContactIndexPresenter extends BasePresenter<ContactIndexView> {
  private contentRepo = inject(ContentRepository);

  load(): void {
    this.contentRepo.profile().subscribe({ next: (c) => this.view.setContent(c), error: () => {} });
  }
}
