import { BffApiError, type BffRequestContext } from '@/lib/bff/utils/request-context';
import { OdooSearchProvider } from '@/lib/search/providers/odoo-search-provider';
import { LendingSearchProvider } from '@/lib/search/providers/lending-search-provider';
import { MarbleSearchProvider } from '@/lib/search/providers/marble-search-provider';
import { InternalSearchProvider } from '@/lib/search/providers/internal-search-provider';
import { canAccessSearchEntity, listAccessibleSearchEntityTypes } from '@/lib/search/access';
import { rankSearchItems } from '@/lib/search/ranking';
import type { SearchProvider, SearchQuery, SearchResponse, SearchSuggestion } from '@/lib/search/types';
import { AuditService } from '@/lib/audit/service';
import { FeatureFlagService, buildFeatureEvaluationContext } from '@/lib/feature-flags/service';

function parseList(value: string | null) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : undefined;
}

export class SearchService {
  private readonly providers: SearchProvider[] = [new OdooSearchProvider(), new LendingSearchProvider(), new MarbleSearchProvider(), new InternalSearchProvider()];
  private readonly audit = new AuditService();
  private readonly flags = new FeatureFlagService();

  buildQuery(context: BffRequestContext, searchParams: URLSearchParams): SearchQuery {
    const query = (searchParams.get('q') ?? '').trim();
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(25, Math.max(1, Number(searchParams.get('pageSize') ?? 10)));
    if (!query) throw new BffApiError('invalid_search_query', 'q is required.', 400);
    if (query.length > 120) throw new BffApiError('invalid_search_query', 'q must be 120 characters or fewer.', 400);
    const entityTypes = parseList(searchParams.get('entityTypes') ?? searchParams.get('entityType')) as SearchQuery['entityTypes'];
    const modules = parseList(searchParams.get('modules') ?? searchParams.get('module')) as SearchQuery['modules'];
    return {
      query,
      tenantId: context.session.activeTenant.id,
      workspaceId: context.session.activeWorkspace?.id,
      entityTypes: entityTypes?.filter((item) => canAccessSearchEntity(context, item as any)) as any,
      modules,
      filters: { status: searchParams.get('status') ?? undefined },
      page,
      pageSize,
      sort: (searchParams.get('sort') as any) || 'relevance',
      currentUserId: context.session.user.id,
      includeSuggestions: searchParams.get('includeSuggestions') === 'true',
      includeCounts: searchParams.get('includeCounts') !== 'false',
      correlationId: context.correlationId,
      mode: searchParams.get('mode') === 'quick' ? 'quick' : searchParams.get('mode') === 'exact' ? 'exact' : 'keyword',
    };
  }

  async search(context: BffRequestContext, searchParams: URLSearchParams): Promise<SearchResponse> {
    const featureContext = buildFeatureEvaluationContext({ session: context.session, internalUser: context.internalUser, correlationId: context.correlationId, currentModule: 'search' });
    if ((await this.flags.evaluateFlag('feature.kill_switch.search', featureContext)).enabled) throw new BffApiError('search_kill_switch_active', 'Search is temporarily disabled by an emergency control.', 503);
    if (!(await this.flags.evaluateFlag('feature.search.enabled', featureContext)).enabled) throw new BffApiError('search_feature_disabled', 'Search is not enabled for the current context.', 403);
    const query = this.buildQuery(context, searchParams);
    const accessibleTypes = listAccessibleSearchEntityTypes(context);
    const finalEntityTypes = query.entityTypes?.length ? query.entityTypes.filter((item) => accessibleTypes.includes(item)) : accessibleTypes;
    const warnings = [] as SearchResponse['warnings'];

    const results = await Promise.all(this.providers.filter((provider) => provider.supports({ ...query, entityTypes: finalEntityTypes })).map(async (provider) => {
      try {
        return await provider.search({ ...query, entityTypes: finalEntityTypes });
      } catch (error) {
        warnings.push({ code: `${provider.key}_search_unavailable`, message: error instanceof Error ? error.message : 'Search provider unavailable.', sourceSystem: provider.key as any, retryable: true });
        return { providerKey: provider.key, items: [], warnings: [] };
      }
    }));

    const merged = rankSearchItems(query, results.flatMap((result) => result.items)
      .filter((item) => finalEntityTypes.includes(item.entityType))
      .filter((item) => !query.modules?.length || query.modules.includes(item.moduleKey)));
    const offset = (query.page - 1) * query.pageSize;
    const pageItems = merged.slice(offset, offset + query.pageSize);
    const suggestions = query.includeSuggestions ? buildSuggestions(pageItems, query.query) : undefined;

    if (['invoice', 'loan', 'case'].some((type) => finalEntityTypes.includes(type as any))) {
      await this.audit.record({ eventType: 'search.sensitive.executed', action: 'search', category: 'data_access', tenantId: context.session.activeTenant.id, workspaceId: context.session.activeWorkspace?.id, actorType: 'user', actorId: context.session.user.id, actorDisplay: context.session.user.displayName, subjectEntityType: 'search', subjectEntityId: query.query, relatedEntityRefs: finalEntityTypes.map((entityType) => ({ entityType: 'search_entity_type', entityId: entityType })), sourceSystem: 'platform', correlationId: context.correlationId, outcome: 'success', severity: 'info', metadata: { query: query.query, entityTypes: finalEntityTypes }, sensitivity: 'internal' });
    }

    return {
      query: query.query,
      items: pageItems,
      countsByEntityType: merged.reduce((acc, item) => ({ ...acc, [item.entityType]: (acc[item.entityType] ?? 0) + 1 }), {}),
      countsByModule: merged.reduce((acc, item) => ({ ...acc, [item.moduleKey]: (acc[item.moduleKey] ?? 0) + 1 }), {}),
      page: query.page,
      pageSize: query.pageSize,
      total: merged.length,
      hasMore: offset + query.pageSize < merged.length,
      suggestions,
      warnings,
      meta: { degraded: warnings.length > 0, entityTypes: finalEntityTypes, ranking: 'exact > startsWith > contains > recency > status' },
    };
  }
}

function buildSuggestions(items: SearchResponse['items'], originalQuery: string): SearchSuggestion[] {
  const suggestions = new Map<string, SearchSuggestion>();
  for (const item of items.slice(0, 5)) {
    suggestions.set(item.title, { value: item.title, label: item.title, type: 'entity', route: item.route, score: item.score, entityType: item.entityType });
    if (item.entityId !== item.title) suggestions.set(item.entityId, { value: item.entityId, label: item.entityId, type: 'identifier', route: item.route, score: item.score - 5, entityType: item.entityType });
  }
  if (!suggestions.has(originalQuery)) suggestions.set(originalQuery, { value: originalQuery, label: `Search for \"${originalQuery}\"`, type: 'query', score: 1 });
  return [...suggestions.values()].slice(0, 6);
}
