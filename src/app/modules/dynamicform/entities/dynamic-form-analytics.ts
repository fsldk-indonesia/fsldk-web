export interface DayCount {
  date: string;
  count: number;
}

export interface RecentSubmission {
  submissionID: number;
  respondentEmail: string;
  respondentName: string;
  isValid: boolean;
  submittedDate: string;
}

export interface ChartBucket {
  label: string;
  count: number;
}

export interface FieldChart {
  fieldID: number;
  label: string;
  fieldType: string;
  chartType: 'doughnut' | 'bar' | 'bar-horizontal';
  buckets: ChartBucket[];
}

export interface DynamicFormAnalytics {
  submissionsPerDay: DayCount[];
  validCount: number;
  invalidCount: number;
  totalFiles: number;
  recent: RecentSubmission[] | null;
  fieldCharts: FieldChart[] | null;
}
