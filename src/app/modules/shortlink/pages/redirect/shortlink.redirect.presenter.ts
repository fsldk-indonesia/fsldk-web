import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ShortlinkRepository } from '../../repositories/shortlink.repository';
import { ShortlinkRedirectView } from './shortlink.redirect.view';

@Injectable()
export class ShortlinkRedirectPresenter extends BasePresenter<ShortlinkRedirectView> {
  private shortlinkRepo = inject(ShortlinkRepository);

  resolve(key: string): void {
    this.shortlinkRepo.resolve(key).subscribe({
      next: (res) => { window.location.href = res.destinationURL; },
      error: () => this.view.setNotFound(),
    });
  }
}
