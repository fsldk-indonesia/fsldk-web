import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { EventRepository } from '../../repositories/event.repository';
import { EventPublicIndexView } from './event.public-index.view';

@Injectable()
export class EventPublicIndexPresenter extends BasePresenter<EventPublicIndexView> {
  private eventRepo = inject(EventRepository);

  load(page: number, limit: number, search: string, division: string, year: string, status: string, sort: string): void {
    this.view.setLoading(true);
    const q: Record<string, unknown> = { page, limit };
    if (search) q['search'] = search;
    if (division) q['division'] = division;
    if (year) q['year'] = year;
    if (status) q['status'] = status;
    if (sort) q['sort'] = sort;

    this.eventRepo.publicList(q).subscribe({
      next: (p) => { this.view.setEvents(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
