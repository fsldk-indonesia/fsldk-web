export type DynamicFieldType =
  | 'short_text' | 'long_text' | 'email' | 'number' | 'phone' | 'url'
  | 'date' | 'time' | 'datetime'
  | 'dropdown' | 'radio' | 'checkbox' | 'linear_scale' | 'rating'
  | 'file'
  | 'section_break' | 'paragraph' | 'image' | 'video';

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

/** One forward-only section jump: picking `optionValue` on a radio/dropdown
 *  sends the respondent to the section that starts at `targetSectionFieldID`
 *  (the fieldID of that `section_break`). */
export interface SectionRoute {
  optionValue: string;
  targetSectionFieldID: number;
}

export interface SectionRouting {
  enabled: boolean;
  routes: SectionRoute[];
}

export interface FieldConfig {
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  maxRating?: number;
  sectionRouting?: SectionRouting;
}

/** One field. *JSON columns arrive parsed (backend passes them through raw).
 *  Sections are not a table — they are the runs of fields between `section_break`
 *  fields (techspec Part 2, K1). */
export interface DynamicFormField {
  fieldID: number;
  formID: number;
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
  fieldConfig: FieldConfig | null;
}
