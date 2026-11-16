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
  const response = await fetch(base + path, { signal, cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('No se pudieron cargar los datos. Intentá nuevamente.');
  return response.json() as Promise<T>;
}
export const directoryApi = {
  visitCount: async (register: boolean): Promise<number> => {
    if (!base) throw new Error('La API del directorio no está configurada.');
    const response = await fetch(base + '/api/directory/visits', {
      method: register ? 'POST' : 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('No se pudo consultar el contador de visitas.');
    const data = await response.json() as { totalVisits: number };
    if (!Number.isFinite(data.totalVisits)) throw new Error('El contador devolvió datos inválidos.');
    return data.totalVisits;
  },
  categories: (signal?: AbortSignal) => get<Category[]>('/api/directory/categories', signal),
  businesses: (params: URLSearchParams, signal?: AbortSignal) =>
    get<PageResponse>('/api/directory/businesses?' + params.toString(), signal),
  submit: async (submission: {name:string;categoryId:number;district:string;description:string;address:string;phone:string;whatsApp:string;contactEmail:string;website:string}): Promise<{message:string}> => {
    if (!base) throw new Error('La API del directorio todavía no está disponible.');
    const response = await fetch(base + '/api/directory/submissions', {
      method:'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify(submission)
    });
    const data = await response.json().catch(()=>({message:'Error del servidor.'}));
    if (!response.ok) throw new Error(response.status===429 ? 'Demasiadas solicitudes. Intentá de nuevo más tarde.' : (typeof data.message==='string'?data.message:'Revisá los datos del formulario.'));
    return data;
  },
  business: (slug: string, signal?: AbortSignal) =>
    get<Business>('/api/directory/businesses/' + encodeURIComponent(slug), signal)
};
