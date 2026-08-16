import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { EventRepository } from '../../repositories/event.repository';
import { EventPublicDetailView } from './event.public-detail.view';

@Injectable()
export class EventPublicDetailPresenter extends BasePresenter<EventPublicDetailView> {
  private eventRepo = inject(EventRepository);

  load(slug: string): void {
    this.view.setLoading(true);
    this.eventRepo.publicDetail(slug).subscribe({
      next: (e) => { this.view.setEvent(e); this.view.setLoading(false); },
      error: () => { this.view.setEvent(null); this.view.setLoading(false); },
    });
  }
}
