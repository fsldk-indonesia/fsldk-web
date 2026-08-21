export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobQueueName = 'whatsapp' | 'email';

export interface Job {
  jobID: number;
  queue: JobQueueName;
  jobType: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  correlationType?: string;
  correlationID?: number;
  availableDate: string;
  createdDate: string;
  completedDate?: string;
  failedDate?: string;
}

export interface JobStats {
  pending: number;
  delayed: number;
  processing: number;
  stuck: number;
  failed: number;
  completed: number;
}
