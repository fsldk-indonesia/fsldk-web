export interface SubscriptionUnsubscribeView {
  setLoading(loading: boolean): void;
  setResult(success: boolean, message: string): void;
}
