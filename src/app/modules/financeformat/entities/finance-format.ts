/** One ms_finance_format row — a downloadable Excel template plus its category. */
export interface FinanceFormat {
  financeFormatID: number;
  fileName: string;
  fileURL: string;
  formatTypeID: number;
  formatTypeName: string;
  isActive: boolean;
  createdDate: string;
}
