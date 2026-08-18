import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthRepository } from '../../modules/user/repositories/auth.repository';

/**
 * Resolusi organizationID "sedang dilihat" untuk halaman CMS ber-scope
 * organisasi (Profil LDK, Persetujuan Kader, Dashboard, Laporan): dari query
 * `?organizationID=` (hasil pilihan org-switcher lokal shell cms-ldk/
 * cms-puskomda/cms-puskomnas — lihat TechSpec Section 19.6), fallback ke
 * home organization akun sendiri HANYA BILA home org itu memang bertipe
 * sama dengan shell yang sedang dibuka.
 *
 * Fallback ke home org TANPA syarat tipe ini dulu jadi bug: seorang Puskomda
 * Verifikator (home org = Puskomda-nya sendiri) yang membuka shell cms-ldk
 * ikut memakai ID Puskomda-nya sendiri sebagai "organisasi sedang dilihat"
 * — org-switcher lalu mencari sibling dari ID itu (Puskomda lain, bukan LDK
 * lain) sehingga daftar LDK-nya sendiri malah tersaring habis jadi kosong,
 * dan Dashboard ikut menampilkan ringkasan tier Puskomda di dalam shell LDK.
 * Pola yang sama menimpa Puskomnas Verifikator/Super Admin (home org null/
 * root Puskomnas) di shell cms-ldk MAUPUN cms-puskomda. Sekarang: bila tipe
 * tidak cocok, kembalikan undefined — cms-layout.component.ts akan auto-pilih
 * organisasi pertama yang benar-benar bertipe sesuai shell (lihat
 * loadOrgOptions()), lalu menulisnya eksplisit ke query param.
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
        const tier = route.snapshot.data['tier'] as string | undefined;
        const u = this.auth.user();
        if (tier && u?.organizationTypeCode === tier) return u.organizationID;
        return undefined;
      }),
    );
  }
}
