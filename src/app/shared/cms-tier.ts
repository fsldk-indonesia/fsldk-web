/**
 * Satu sumber kebenaran untuk 4 shell CMS (base path, label tampilan, ikon)
 * — sebelumnya nilai ini digandakan di 3 tempat berbeda (site-header desktop
 * + mobile + cms-layout dropdown) sehingga rename label (miss-development-
 * prompt-3.md poin 6) berisiko kelewat di salah satunya. `label` BUKAN nama
 * teknis CMS (semua tetap route /cms*), murni istilah yang ditampilkan ke
 * pengguna: CMS Utama disebut "Portal Admin", 3 tier lain disebut "Portal X".
 */
export type CmsTier = 'FSLDK' | 'PUSKOMNAS' | 'PUSKOMDA' | 'LDK';

export const CMS_SHELL_BASE: Record<CmsTier, string> = {
  FSLDK: '/cms', PUSKOMNAS: '/cms-puskomnas', PUSKOMDA: '/cms-puskomda', LDK: '/cms-ldk',
};

export const CMS_SHELL_LABEL: Record<CmsTier, string> = {
  FSLDK: 'Portal Admin', PUSKOMNAS: 'Portal Puskomnas', PUSKOMDA: 'Portal Puskomda', LDK: 'Portal LDK',
};

export const CMS_SHELL_ICON: Record<CmsTier, string> = {
  FSLDK: 'dashboard', PUSKOMNAS: 'landmark', PUSKOMDA: 'building-2', LDK: 'building',
};

/**
 * Palet --color-primary(-bright/-dark/-soft) per tier ber-tema (LDK/Puskomda/
 * Puskomnas — lihat nilai identik di .cms.tier-* pada cms-layout.component.ts).
 * FSLDK SENGAJA tidak ada di sini — dia memakai default :root global, jadi
 * konsumen (mis. PrayerTimeComponent) yang tidak menemukan entry di sini
 * tinggal fallback ke var(--color-primary) bawaan, bukan override apa pun.
 * Dipisah ke sini (bukan cuma di cms-layout.component.ts) karena komponen
 * lain yang node-nya dipindah ke document.body (keluar dari scope CSS
 * custom property .cms.tier-*, lihat catatan di PrayerTimeComponent) perlu
 * nilai hex-nya langsung, bukan lewat inheritance var().
 */
export const CMS_TIER_ACCENT: Partial<Record<CmsTier, { primary: string; bright: string; dark: string; soft: string }>> = {
  LDK: { primary: '#063c84', bright: '#1f5db3', dark: '#042c61', soft: '#e2e9f5' },
  PUSKOMDA: { primary: '#186541', bright: '#2f9161', dark: '#0f4a30', soft: '#e0f0e6' },
  PUSKOMNAS: { primary: '#55408f', bright: '#7a63b8', dark: '#3e2f6b', soft: '#ece8f7' },
};
