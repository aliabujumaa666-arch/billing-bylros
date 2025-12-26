export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export const calculatePagination = (
  total: number,
  page: number,
  pageSize: number
): { from: number; to: number; totalPages: number; hasMore: boolean } => {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize;
  const to = Math.min(from + pageSize - 1, total - 1);
  const hasMore = page < totalPages;

  return { from, to, totalPages, hasMore };
};

export const getPageNumbers = (currentPage: number, totalPages: number, maxVisible = 5): number[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains';
  value: any;
}

export const applyFilters = (query: any, filters: FilterConfig[]) => {
  let modifiedQuery = query;

  filters.forEach(filter => {
    switch (filter.operator) {
      case 'eq':
        modifiedQuery = modifiedQuery.eq(filter.field, filter.value);
        break;
      case 'neq':
        modifiedQuery = modifiedQuery.neq(filter.field, filter.value);
        break;
      case 'gt':
        modifiedQuery = modifiedQuery.gt(filter.field, filter.value);
        break;
      case 'gte':
        modifiedQuery = modifiedQuery.gte(filter.field, filter.value);
        break;
      case 'lt':
        modifiedQuery = modifiedQuery.lt(filter.field, filter.value);
        break;
      case 'lte':
        modifiedQuery = modifiedQuery.lte(filter.field, filter.value);
        break;
      case 'like':
        modifiedQuery = modifiedQuery.like(filter.field, filter.value);
        break;
      case 'ilike':
        modifiedQuery = modifiedQuery.ilike(filter.field, filter.value);
        break;
      case 'in':
        modifiedQuery = modifiedQuery.in(filter.field, filter.value);
        break;
      case 'contains':
        modifiedQuery = modifiedQuery.contains(filter.field, filter.value);
        break;
    }
  });

  return modifiedQuery;
};
