export interface LoginView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(): void;
  navigateAfterLogin(cmsPath: string | null): void;
}
