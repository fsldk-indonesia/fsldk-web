export type DynamicFieldType =
  | 'short_text' | 'long_text' | 'email' | 'number' | 'phone' | 'url'
  | 'date' | 'time' | 'datetime'
  | 'dropdown' | 'radio' | 'checkbox' | 'linear_scale' | 'rating'
  | 'file'
  | 'section_break' | 'paragraph' | 'image';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  acceptedTypes?: string[];
  maxSizeKB?: number | null;
}

export interface ConditionalCondition {
  fieldID: number;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'filled' | 'empty';
  value: string;
}

export interface ConditionalLogic {
  action: 'show' | 'hide';
  match: 'all' | 'any';
  conditions: ConditionalCondition[];
}

export interface FieldConfig {
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  maxRating?: number;
}

/** One field. *JSON columns arrive parsed (backend passes them through raw). */
export interface DynamicFormField {
  fieldID: number;
  formID: number;
  sectionID: number | null;
  fieldType: DynamicFieldType;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  isSystemField: boolean;
  sortOrder: number;
  options: FieldOption[] | null;
  validation: FieldValidation | null;
  defaultValue: string | null;
  conditionalLogic: ConditionalLogic | null;
  fieldConfig: FieldConfig | null;
}

export interface DynamicFormSection {
  sectionID: number;
  formID?: number;
  title: string;
  description: string | null;
  sortOrder: number;
}
