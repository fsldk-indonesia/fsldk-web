import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ContentRepository } from '../../../content/repositories/content.repository';
import { AboutIndexView } from './about.index.view';

@Injectable()
export class AboutIndexPresenter extends BasePresenter<AboutIndexView> {
  private contentRepo = inject(ContentRepository);

  load(): void {
    this.contentRepo.profile().subscribe({ next: (c) => this.view.setContent(c), error: () => {} });
    this.contentRepo.publicOrgStructure().subscribe({ next: (o) => this.view.setOrgMembers(o), error: () => {} });
  }
}
