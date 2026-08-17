export interface RegisterView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(email: string): void;
  navigateAfterLogin(cmsPath: string | null): void;
}
