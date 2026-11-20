import type { Business, PageResponse } from './api';

// Cache only the small public directory listing, not private administrative data.
const KEY = 'directorio-sarchi-list-v1:';
const INDEX = 'directorio-sarchi-list-index-v1';
const MAX_ENTRIES = 10;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
type Entry = { savedAt: number; response: PageResponse };

export function readCachedListings(key: string): Entry | null {
  try {
    const raw = localStorage.getItem(KEY + key);
    if (!raw) return null;
    const entry: Entry = JSON.parse(raw);
    if (!entry || !Number.isFinite(entry.savedAt) || Date.now() - entry.savedAt > MAX_AGE_MS ||
        !entry.response || !Array.isArray(entry.response.items) ||
        !Number.isFinite(entry.response.total)) {
      localStorage.removeItem(KEY + key);
      return null;
    }
    return entry;
  } catch { return null; } // Storage may be blocked in private mode.
}

export function cacheListings(key: string, response: PageResponse) {
  try {
    const compactItems: Business[] = response.items.map(b => ({
      id: b.id, slug: b.slug, name: b.name, phone: b.phone,
      district: b.district, category: b.category,
      // The list does not need the full business details or other personal data.
      description: null, address: null, whatsApp: null,
      imageUrl: b.imageUrl, mapsUrl: null, website: null
    }));
    localStorage.setItem(KEY + key, JSON.stringify({
      savedAt: Date.now(),
      response: { page: response.page, pageSize: response.pageSize, total: response.total, items: compactItems }
    } satisfies Entry));
    let index: string[] = [];
    try { index = JSON.parse(localStorage.getItem(INDEX) || '[]') as string[]; } catch { /* Ignore corrupted index. */ }
    index = [key, ...index.filter(k => k !== key)];
    index.slice(MAX_ENTRIES).forEach(k => localStorage.removeItem(KEY + k));
    localStorage.setItem(INDEX, JSON.stringify(index.slice(0, MAX_ENTRIES)));
  } catch { /* Quota and disabled storage never stop a directory request. */ }
}
