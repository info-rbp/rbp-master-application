import type { SearchQuery, SearchResultItem } from './types';

function scoreText(query: string, value: string | undefined) {
  if (!value) return 0;
  const q = query.trim().toLowerCase();
  const v = value.toLowerCase();
  if (!q) return 0;
  if (v === q) return 120;
  if (v.startsWith(q)) return 80;
  if (v.includes(q)) return 45;
  return 0;
}

function scoreRecency(updatedAt?: string, createdAt?: string) {
  const timestamp = updatedAt ?? createdAt;
  if (!timestamp) return 0;
  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(ageMs)) return 0;
  if (ageMs < 1000 * 60 * 60 * 24 * 3) return 12;
  if (ageMs < 1000 * 60 * 60 * 24 * 14) return 6;
  return 0;
}

function statusAdjustment(status?: string) {
  if (!status) return 0;
  if (['active', 'open', 'submitted', 'waiting_internal'].includes(status)) return 8;
  if (['completed', 'cancelled', 'dismissed'].includes(status)) return -4;
  return 0;
}

export function rankSearchItems(query: SearchQuery, items: SearchResultItem[]) {
  return items
    .map((item) => ({
      ...item,
      score: item.score + scoreText(query.query, item.entityId) + scoreText(query.query, item.title) + scoreText(query.query, item.subtitle) + scoreRecency(item.updatedAt, item.createdAt) + statusAdjustment(item.status),
    }))
    .sort((a, b) => {
      if (query.sort === 'title_asc') return a.title.localeCompare(b.title);
      if (query.sort === 'created_desc') return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
      if (query.sort === 'updated_desc') return String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''));
      return b.score - a.score || String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')) || a.title.localeCompare(b.title);
    });
}
