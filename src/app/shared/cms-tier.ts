/**
 * Satu sumber kebenaran untuk 4 shell CMS (base path, label tampilan, ikon)
 * — sebelumnya nilai ini digandakan di 3 tempat berbeda (site-header desktop
 * + mobile + cms-layout dropdown) sehingga rename label (miss-development-
 * prompt-3.md poin 6) berisiko kelewat di salah satunya. `label` BUKAN nama
 * teknis CMS (semua tetap route /cms*), murni istilah yang ditampilkan ke
 * pengguna: CMS Utama tetap disebut "CMS", 3 tier lain disebut "Portal X".
 */
export type CmsTier = 'FSLDK' | 'PUSKOMNAS' | 'PUSKOMDA' | 'LDK';

export const CMS_SHELL_BASE: Record<CmsTier, string> = {
  FSLDK: '/cms', PUSKOMNAS: '/cms-puskomnas', PUSKOMDA: '/cms-puskomda', LDK: '/cms-ldk',
};

export const CMS_SHELL_LABEL: Record<CmsTier, string> = {
  FSLDK: 'CMS', PUSKOMNAS: 'Portal Puskomnas', PUSKOMDA: 'Portal Puskomda', LDK: 'Portal LDK',
};

export const CMS_SHELL_ICON: Record<CmsTier, string> = {
  FSLDK: 'dashboard', PUSKOMNAS: 'landmark', PUSKOMDA: 'building-2', LDK: 'building',
};
