export type Category = { id: number; name: string; slug: string };
export type Business = {
  id: number; slug: string; name: string; description: string | null;
  district: string; address: string | null; phone: string | null;
  whatsApp: string | null; website: string | null; imageUrl: string | null;
  category: Category;
};
export type PageResponse = { page: number; pageSize: number; total: number; items: Business[] };
const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!base) throw new Error('Configurá VITE_API_URL para conectar con Sin Filas.');
  const response = await fetch(base + path, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('No se pudieron cargar los datos. Intentá nuevamente.');
  return response.json() as Promise<T>;
}
export const directoryApi = {
  categories: (signal?: AbortSignal) => get<Category[]>('/api/directory/categories', signal),
  businesses: (params: URLSearchParams, signal?: AbortSignal) =>
    get<PageResponse>('/api/directory/businesses?' + params.toString(), signal),
  business: (slug: string, signal?: AbortSignal) =>
    get<Business>('/api/directory/businesses/' + encodeURIComponent(slug), signal)
};
