export interface PaginationMetadata {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationMetadata
}
