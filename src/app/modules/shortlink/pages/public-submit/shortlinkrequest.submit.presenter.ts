import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ShortlinkRequestRepository } from '../../repositories/shortlinkrequest.repository';
import { SubmitShortLinkRequestBody } from '../../services/shortlinkrequest-api.service';
import { ShortLinkRequestSubmitView } from './shortlinkrequest.submit.view';

@Injectable()
export class ShortlinkRequestSubmitPresenter extends BasePresenter<ShortLinkRequestSubmitView> {
  private shortlinkRequestRepo = inject(ShortlinkRequestRepository);

  submit(body: SubmitShortLinkRequestBody): void {
    this.view.setLoading(true);
    this.shortlinkRequestRepo.submit(body).subscribe({
      next: () => { this.view.setLoading(false); this.view.onSubmitSuccess(); },
      error: () => this.view.setLoading(false),
    });
  }

  /** Kartu "Konfirmasi via WhatsApp" bersifat dekoratif/opsional — kegagalan
   *  memuat PIC (belum dikonfigurasi atau error jaringan) tidak boleh
   *  mengganggu alur pengisian form, jadi tidak ada toast error di sini. */
  loadPIC(): void {
    this.shortlinkRequestRepo.pic().subscribe({
      next: (pic) => this.view.setPIC(pic),
      error: () => this.view.setPIC(null),
    });
  }
}
