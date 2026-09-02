import { FinanceFormat } from '../../entities/finance-format';
import { FinanceFormatType } from '../../entities/finance-format-type';

export interface FinanceFormatIndexView {
  setItems(items: FinanceFormat[], count: number): void;
  setTypes(types: FinanceFormatType[]): void;
  onPublishToggleSuccess(): void;
  onRemoveSuccess(): void;
  onActionSettled(id: number): void;
}
