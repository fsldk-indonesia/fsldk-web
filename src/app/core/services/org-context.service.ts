import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthRepository } from '../../modules/user/repositories/auth.repository';

/**
 * Resolusi organizationID "sedang dilihat" untuk halaman CMS ber-scope
 * organisasi (Profil LDK, Persetujuan Kader, Dashboard, Laporan): dari query
 * `?organizationID=` (hasil pilihan org-switcher lokal shell cms-ldk/
 * cms-puskomda/cms-puskomnas — lihat TechSpec Section 19.6), fallback ke
 * home organization akun sendiri bila belum ada pilihan eksplisit.
 *
 * Sengaja query param (bukan path param bersarang) — tetap eksplisit &
 * bisa dibookmark/dibagikan sesuai Section 19.6, tapi tidak memaksa setiap
 * *.routes.ts anak dari cms-ldk/cms-puskomda/cms-puskomnas mengetahui soal
 * parameter organisasi. Dibaca sebagai Observable (bukan snapshot) supaya
 * halaman ikut refetch saat switcher berpindah tanpa reload komponen.
 */
@Injectable({ providedIn: 'root' })
export class OrgContextService {
  private auth = inject(AuthRepository);

  organizationID$(route: ActivatedRoute): Observable<number | undefined> {
    return route.queryParamMap.pipe(
      map((params) => {
        const raw = params.get('organizationID');
        if (raw) {
          const id = Number(raw);
          if (Number.isFinite(id) && id > 0) return id;
        }
        return this.auth.user()?.organizationID;
      }),
    );
  }
}
