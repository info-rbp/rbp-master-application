import type { SearchResponseDto } from '@/lib/bff/dto/search';
import type { BffRequestContext } from '@/lib/bff/utils/request-context';
import { SearchService } from '@/lib/search/service';

export class SearchBffService {
  private readonly search = new SearchService();
  async searchAll(context: BffRequestContext, searchParams: URLSearchParams): Promise<SearchResponseDto> {
    return this.search.search(context, searchParams);
  }
}
