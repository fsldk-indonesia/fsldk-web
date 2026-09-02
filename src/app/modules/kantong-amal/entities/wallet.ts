export interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  totalCollected: number;
  totalWithdrawn: number;
}

export interface LedgerListItem {
  ledgerID: number;
  entryType: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  referenceType: string;
  referenceID: number;
  note?: string;
  createdDate: string;
}
