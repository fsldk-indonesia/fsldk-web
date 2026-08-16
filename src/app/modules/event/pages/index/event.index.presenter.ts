import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { EventRepository } from '../../repositories/event.repository';
import { Event as AppEvent } from '../../entities/event';
import { EventIndexView } from './event.index.view';

@Injectable()
export class EventIndexPresenter extends BasePresenter<EventIndexView> {
  private eventRepo = inject(EventRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, search: string, division: string): void {
    const q: Record<string, unknown> = { page, limit };
    if (search) q['search'] = search;
    if (division) q['division'] = division;
    this.eventRepo.cmsList(q).subscribe({
      next: (p) => this.view.setEvents(p.data, p.count),
      error: () => {},
    });
  }

  remove(e: AppEvent): void {
    this.eventRepo.remove(e.eventID).subscribe({
      next: () => { this.toast.success('Event dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(e.eventID); },
      error: () => this.view.onActionSettled(e.eventID),
    });
  }
}
