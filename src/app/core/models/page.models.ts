export interface PageRequest {
  page: number;
  size: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  globalFilter?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
