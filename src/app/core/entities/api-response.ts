/** Amplop response standar dari FSLDK API — dipakai lintas seluruh modul. */
export interface ApiResponse<T> {
  path: string;
  timestamp: string;
  status: 'ok' | 'fail';
  code: string;
  message: string;
  result: T;
  errors: FieldError[] | null;
}

export interface FieldError {
  attribute: string;
  field?: string;
  code: string;
  message: string;
}
