
import { Component, OnInit, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/icon.component';

import { RapimnasLombaSetting } from '../../entities/rapimnas-lomba';
import { RapimnasLombaApiService } from '../../services/rapimnas-lomba-api.service';

@Component({
  selector: 'app-rapimnas-pendaftaran-lomba-page',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './rapimnas.pendaftaran-lomba.page.html',
  styleUrls: ['./rapimnas.pendaftaran-lomba.page.css'],
})
export class RapimnasPendaftaranLombaPage implements OnInit {
  private readonly api = inject(RapimnasLombaApiService);

  readonly lomba = signal<RapimnasLombaSetting | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.api.getPublic().subscribe({
      next: (data) => {
        this.lomba.set(data);
        this.error.set('');
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'Informasi lomba belum dapat dimuat. Silakan coba kembali.'
        );
        this.loading.set(false);
      },
    });
  }
  
  whatsappUrl(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const normalized = digits.startsWith('0')
      ? '62' + digits.slice(1)
      : digits;

    return 'https://wa.me/' + normalized;
  }

}
