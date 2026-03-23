import type { ModuleDefinition } from '@/lib/platform/types';
import type { SourceReference } from '@/lib/platform/integrations/types';
import type { WarningDto } from '@/lib/bff/dto/common';

export type SearchEntityType = 'customer' | 'application' | 'loan' | 'document' | 'invoice' | 'support_ticket' | 'task' | 'knowledge' | 'workflow' | 'case';
export type SearchSort = 'relevance' | 'updated_desc' | 'created_desc' | 'title_asc';
export type SearchSuggestionType = 'entity' | 'identifier' | 'query';

export type SearchQuery = {
  query: string;
  tenantId: string;
  workspaceId?: string;
  entityTypes?: SearchEntityType[];
  modules?: ModuleDefinition['key'][];
  filters: Record<string, string | number | boolean | undefined>;
  page: number;
  pageSize: number;
  sort: SearchSort;
  currentUserId: string;
  includeSuggestions?: boolean;
  includeCounts?: boolean;
  correlationId: string;
  mode?: 'keyword' | 'quick' | 'exact';
};

export type SearchSuggestion = {
  value: string;
  label: string;
  type: SearchSuggestionType;
  route?: string;
  score?: number;
  entityType?: SearchEntityType;
};

export type SearchResultItem = {
  id: string;
  resultType: 'entity' | 'task' | 'workflow';
  entityType: SearchEntityType;
  entityId: string;
  moduleKey: ModuleDefinition['key'];
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  badges: string[];
  highlights: string[];
  route: string;
  sourceSystem: SourceReference['sourceSystem'] | 'platform';
  sourceRefs: SourceReference[];
  score: number;
  matchedFields: string[];
  createdAt?: string;
  updatedAt?: string;
  accessLevel?: 'tenant' | 'workspace' | 'internal';
  meta: Record<string, unknown>;
};

export type SearchResponse = {
  query: string;
  items: SearchResultItem[];
  countsByEntityType: Partial<Record<SearchEntityType, number>>;
  countsByModule: Partial<Record<ModuleDefinition['key'], number>>;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  suggestions?: SearchSuggestion[];
  warnings: WarningDto[];
  meta: Record<string, unknown>;
};

export type SearchProviderResult = {
  providerKey: string;
  items: SearchResultItem[];
  suggestions?: SearchSuggestion[];
  warnings?: WarningDto[];
};

export interface SearchProvider {
  readonly key: string;
  readonly supportedEntityTypes: SearchEntityType[];
  supports(query: SearchQuery): boolean;
  search(query: SearchQuery): Promise<SearchProviderResult>;
  getEntityTypeSupport(): SearchEntityType[];
  getHealth(): Promise<{ key: string; status: 'healthy' | 'degraded' | 'down' }>;
}
