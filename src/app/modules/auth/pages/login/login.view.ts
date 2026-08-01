export interface LoginView {
  setLoading(loading: boolean): void;
  navigateToVerifyEmail(): void;
  navigateToDashboard(): void;
}
