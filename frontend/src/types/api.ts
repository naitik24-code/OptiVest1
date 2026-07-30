export interface MetaEnvelope {
  timestamp: string;
  request_id?: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ErrorDetail | null;
  meta: MetaEnvelope;
}
