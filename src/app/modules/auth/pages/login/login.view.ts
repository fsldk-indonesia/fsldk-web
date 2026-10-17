export interface LoginView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(): void;
  /** cmsPath (dari AuthRepository.defaultCmsPath() — dashboard tier ATAU
   *  Portal Kader untuk role Kader) SELALU menang kalau ada; returnUrl cuma
   *  dipakai saat cmsPath null (mis. Pengunjung tanpa akses CMS/Kader). */
  navigateAfterLogin(cmsPath: string | null): void;
}
