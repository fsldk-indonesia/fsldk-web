export interface Setting {
  settingID: number;
  settingGroup: string;
  settingKey: string;
  settingLabel: string;
  settingValue: string;
  /** Nilai kedua generik — dipakai pertama kali oleh group "deadline" untuk
   *  estimasi biaya (digit polos, mis. "1500000"). String kosong untuk
   *  setting lain yang tidak membutuhkannya. */
  settingValue2: string;
  updatedDate?: string;
}
