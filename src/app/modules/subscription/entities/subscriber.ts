export interface Subscriber {
  subscriberID: number;
  email: string;
  isActive: boolean;
  subscribedDate: string;
  unsubscribedDate: string | null;
  createdDate: string;
}

export interface BulkAddResult {
  added: number;
  skipped: string[];
  invalid: string[];
}
