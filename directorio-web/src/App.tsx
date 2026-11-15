import { useEffect, useState } from 'react';
import { Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, ExternalLink, MapPin, Menu, MessageCircle, Phone, Search, Store, X, Info, Plus, SlidersHorizontal } from 'lucide-react';
import { directoryApi, type Business, type Category } from './api';
import Register from './Register';
import Admin from './Admin';

const districts = ['Sarchí Norte', 'Sarchí Sur', 'Toro Amarillo', 'San Pedro', 'Rodríguez'];
const tiles = [
  { label: 'Comida', emoji: '🍽️', key: 'comida' },
  { label: 'Belleza', emoji: '💇', key: 'belleza' },
  { label: 'Talleres', emoji: '🔧', key: 'talleres' },
  { label: 'Tiendas', emoji: '🛍️', key: 'tiendas' },
  { label: 'Artesanías', emoji: '🪵', key: 'artesanias' },
  { label: 'Salud', emoji: '🩺', key: 'salud' },
  { label: 'Turismo', emoji: '🌿', key: 'turismo' },
  { label: 'Servicios', emoji: '⚡', key: 'servicios' }
];
const waUrl = (number: string) => {
  const digits = number.replace(/\D/g, '');
  return 'https://wa.me/' + (digits.length === 8 ? '506' + digits : digits);
};
const safeWebsite = (url: string) => {
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null; }
  catch { return null; }
};
function Header() {
  const [open, setOpen] = useState(false);
  return <header className="header"><div className="shell header-inner">
    <Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark">DS</span><span>Directorio <strong>Sarchí</strong></span></Link>
    <button className="mobile-menu" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
    <nav className={open ? 'nav open' : 'nav'}>
      <Link to="/" onClick={() => setOpen(false)}>Explorar negocios</Link>
      <a href="#categorias" onClick={() => setOpen(false)}>Categorías</a>
      <Link className="nav-cta" to="/registrar-negocio" onClick={() => setOpen(false)}>Registrar mi negocio <ArrowRight size={15}/></Link>
    </nav>
  </div></header>;
}
function Footer() { return <footer className="footer"><div className="shell foot-inner"><div><strong>Directorio Sarchí</strong><p>Lo que buscás, está en Sarchí. 🇨🇷</p></div><p>Hecho para conectar a nuestra comunidad.</p></div></footer>; }
function BusinessCard({ b }: { b: Business }) {
  const detail = '/negocio/' + encodeURIComponent(b.slug);
  const phone = b.phone?.replace(/[^+0-9]/g,'') || '';
  return <article className="phone-row">
    <Link to={detail} className="phone-avatar" aria-label={'Información de ' + b.name}>
      {b.imageUrl ? <img src={b.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement?.classList.add('image-failed');}} /> : null}
      <span className="avatar-letter">{b.name.slice(0,1).toUpperCase()}</span>
    </Link>
    <div className="phone-identity">
      <Link to={detail} className="phone-name">{b.name}</Link>
      <span className="phone-number">{b.phone || 'Teléfono no disponible'}</span>
      <span className="phone-meta">{b.category.name} · {b.district}</span>
    </div>
    <div className="phone-actions">
      <Link to={detail} aria-label={'Ver información de ' + b.name} title="Información" className="phone-action info"><Info size={19}/></Link>
      {phone ? <a href={'tel:'+phone} aria-label={'Llamar a '+b.name} title="Llamar" className="phone-action call"><Phone size={18}/></a> : <span className="phone-action unavailable" aria-label="Teléfono no disponible" title="Teléfono no disponible"><Phone size={18}/></span>}
      {b.whatsApp ? <a href={waUrl(b.whatsApp)} target="_blank" rel="noopener noreferrer" aria-label={'WhatsApp de '+b.name} title="WhatsApp" className="phone-action wa"><MessageCircle size={19}/></a> : <span className="phone-action unavailable" aria-label="WhatsApp no disponible" title="WhatsApp no disponible"><MessageCircle size={19}/></span>}
    </div>
  </article>;
}

function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const district = params.get('district') || '';
  const categoryId = params.get('categoryId') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [term,setTerm] = useState(search);
  const [categories,setCategories] = useState<Category[]>([]);
  const [data,setData] = useState<{items:Business[];total:number;pageSize:number}|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [filtersOpen,setFiltersOpen] = useState(false);
  useEffect(()=>{setTerm(search)},[search]);
  useEffect(()=>{
    const controller=new AbortController();
    directoryApi.categories(controller.signal).then(setCategories).catch(()=>{});
    return ()=>controller.abort();
  },[]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    const query=new URLSearchParams();
    if(search)query.set('search',search);
    if(district)query.set('district',district);
    if(categoryId)query.set('categoryId',categoryId);
    query.set('page',String(page));query.set('pageSize','30');
    directoryApi.businesses(query,controller.signal).then(setData).catch(e=>{if(!controller.signal.aborted){setError((e as Error).message);setData(null);}}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return ()=>controller.abort();
  },[search,district,categoryId,page]);
  function update(key:string,value:string){
    const next=new URLSearchParams(params);
    if(value)next.set(key,value);else next.delete(key);
    next.delete('page');setParams(next);
  }
  function changePage(nextPage:number){const next=new URLSearchParams(params);next.set('page',String(nextPage));setParams(next);document.getElementById('resultados')?.scrollIntoView({behavior:'smooth'});}
  const selectedCategory=categories.find(c=>String(c.id)===categoryId);
  return <main className="shell directory-home">
    <div className="directory-intro">
      <div className="intro-label"><span className="live-dot"/> SARCHÍ · COSTA RICA</div>
      <h1>Directorio<span> Sarchí</span></h1>
      <p>Lo que buscás, está en Sarchí.</p>
    </div>
    <form className="phone-search" role="search" onSubmit={e=>{e.preventDefault();update('search',term.trim());}}>
      <Search size={21} aria-hidden="true"/>
      <input type="search" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Buscar negocio o servicio" aria-label="Buscar negocio o servicio" maxLength={100}/>
      {term&&<button type="button" className="clear-search" onClick={()=>{setTerm('');update('search','');}} aria-label="Borrar búsqueda"><X size={17}/></button>}
      <button type="submit" className="search-go" aria-label="Buscar"><ArrowRight size={19}/></button>
    </form>
    <div id="categorias" className="phone-chips" aria-label="Filtrar por categoría">
      <button className={!categoryId?'selected':''} onClick={()=>update('categoryId','')}>Todos</button>
      {tiles.map(tile=>{
        const cat=categories.find(c=>c.slug===tile.key);
        return cat?<button key={tile.key} className={String(cat.id)===categoryId?'selected':''} onClick={()=>update('categoryId',String(cat.id))}>{tile.emoji} {tile.label}</button>:null;
      })}
    </div>
    <div className="phone-toolbar">
      <div><h2>Negocios</h2><span>{loading?'Cargando...':error?'Sin conexión':data?.total===1?'1 negocio':(data?.total??0)+' negocios'}</span></div>
      <button className={district?'filter-toggle is-active':'filter-toggle'} onClick={()=>setFiltersOpen(v=>!v)} aria-expanded={filtersOpen} aria-controls="district-filter"><SlidersHorizontal size={17}/> Distrito</button>
    </div>
    {filtersOpen&&<div className="district-filter" id="district-filter"><label htmlFor="district-select">Mostrar negocios en</label><select id="district-select" value={district} onChange={e=>update('district',e.target.value)}><option value="">Todos los distritos</option>{districts.map(d=><option key={d}>{d}</option>)}</select></div>}
    {(search||district||categoryId)&&<div className="active-filters"><span>{[search,district,selectedCategory?.name].filter(Boolean).join(' · ')}</span><button onClick={()=>{setTerm('');setParams(new URLSearchParams());}}><X size={14}/> Limpiar</button></div>}
    <section id="resultados" className="phone-directory" aria-label="Lista de negocios">
      {loading?<div className="phone-loading" aria-busy="true">{Array.from({length:6},(_,i)=><div className="phone-row skeleton-row" key={i}><div className="skeleton-avatar"/><div className="skeleton-text"><i/><i/></div></div>)}</div>:
      error?<div className="phone-empty"><Store size={31}/><h3>No pudimos cargar los negocios</h3><p>{error}</p><button onClick={()=>window.location.reload()}>Intentar de nuevo</button></div>:
      data?.items.length?<div className="phone-list">{data.items.map(b=><BusinessCard key={b.id} b={b}/>)}</div>:
      <div className="phone-empty"><Search size={31}/><h3>No encontramos negocios</h3><p>Probá otro nombre, servicio o distrito.</p><button onClick={()=>{setTerm('');setParams(new URLSearchParams());}}>Ver todos</button></div>}
    </section>
    {!loading&&!error&&data&&data.total>data.pageSize&&<div className="pagination"><button disabled={page===1} onClick={()=>changePage(page-1)}>Anterior</button><span>{page} / {Math.ceil(data.total/data.pageSize)}</span><button disabled={page*data.pageSize>=data.total} onClick={()=>changePage(page+1)}>Siguiente</button></div>}
    <Link className="directory-register" to="/registrar-negocio"><span><Plus size={19}/></span><div><strong>¿Tenés un negocio?</strong><small>Agregalo gratis a nuestro directorio</small></div><ArrowRight size={19}/></Link>
  </main>;
}
function Detail() {
  const { slug = '' } = useParams();
  const [biz, setBiz] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { const ctrl = new AbortController(); setLoading(true); directoryApi.business(slug, ctrl.signal).then(setBiz).catch(e => { if (!ctrl.signal.aborted) setError((e as Error).message); }).finally(() => { if (!ctrl.signal.aborted) setLoading(false); }); return () => ctrl.abort(); }, [slug]);
  return <main className="shell detail-page"><Link to="/" className="back-link"><ArrowLeft size={18}/> Volver a negocios</Link>
    {loading ? <p>Cargando negocio...</p> : error || !biz ? <div className="empty-state"><h2>No encontramos este negocio</h2><p>{error || 'Es posible que aún no esté publicado.'}</p><Link to="/">Volver al directorio</Link></div> :
    <div className="detail-layout"><div className="detail-main"><div className="detail-image">{biz.imageUrl ? <img src={biz.imageUrl} alt={biz.name}/> : <Store size={65}/>}</div><span className="eyebrow">{biz.category.name}</span><h1>{biz.name}</h1><p className="detail-desc">{biz.description || 'Descubrí este negocio local de Sarchí.'}</p></div>
      <aside className="contact-card"><h2>Información del negocio</h2><p><MapPin size={18}/> <span>{biz.district}{biz.address && <><br/>{biz.address}</>}</span></p>{biz.phone && <p><Phone size={18}/><a href={'tel:' + biz.phone}>{biz.phone}</a></p>}
      <div className="contact-actions">{biz.whatsApp && <a className="contact-primary" href={waUrl(biz.whatsApp)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/> Contactar por WhatsApp</a>}
      {biz.address && <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(biz.address + ', ' + biz.district + ', Sarchí, Costa Rica')} target="_blank" rel="noopener noreferrer"><MapPin size={18}/> Cómo llegar</a>}
      {biz.website && safeWebsite(biz.website) && <a href={safeWebsite(biz.website)!} target="_blank" rel="noopener noreferrer"><ExternalLink size={18}/> Visitar sitio web</a>}</div></aside></div>}
  </main>;
}
export default function App() { return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/negocio/:slug" element={<Detail/>}/><Route path="/registrar-negocio" element={<Register/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<main className="shell detail-page empty-state"><Clock3 size={32}/><h2>Página no encontrada</h2><Link to="/">Volver al inicio</Link></main>}/></Routes><Footer/></>; }
