import { DynamicForm } from '../../entities/dynamic-form';
import { DynamicFormAnalytics } from '../../entities/dynamic-form-analytics';

export interface DynamicFormAnalyticsView {
  setForm(form: DynamicForm): void;
  setAnalytics(data: DynamicFormAnalytics): void;
}
