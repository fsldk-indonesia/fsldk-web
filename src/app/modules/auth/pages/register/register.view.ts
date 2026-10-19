export interface RegisterView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(email: string): void;
  /** Lihat catatan LoginView.navigateAfterLogin — perilaku identik. */
  navigateAfterLogin(cmsPath: string | null): void;
}
