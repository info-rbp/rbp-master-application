export type SearchQueryDto = {
  query: string;
  entityTypes?: string[];
  modules?: string[];
  page: number;
  pageSize: number;
  sort: string;
};

export type SearchSuggestionDto = {
  value: string;
  label: string;
  type: string;
  route?: string;
  score?: number;
  entityType?: string;
};

export type SearchResultItemDto = {
  id: string;
  resultType: string;
  entityType: string;
  entityId: string;
  moduleKey: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  badges: string[];
  highlights: string[];
  route: string;
  sourceSystem: string;
  sourceRefs: unknown[];
  score: number;
  matchedFields: string[];
  createdAt?: string;
  updatedAt?: string;
  accessLevel?: string;
  meta: Record<string, unknown>;
};

export type SearchResponseDto = {
  query: string;
  items: SearchResultItemDto[];
  countsByEntityType: Record<string, number>;
  countsByModule: Record<string, number>;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  suggestions?: SearchSuggestionDto[];
  warnings: Array<{ code: string; message: string }>;
  meta: Record<string, unknown>;
};
