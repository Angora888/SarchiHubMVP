import { useEffect, useState } from 'react';
import { Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, ExternalLink, MapPin, Menu, MessageCircle, Phone, Search, Store, X } from 'lucide-react';
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
  return <article className="biz-card"><Link to={'/negocio/' + encodeURIComponent(b.slug)} className="biz-image" aria-label={'Ver ' + b.name}>
    {b.imageUrl ? <img src={b.imageUrl} alt={'Fotografía de ' + b.name} loading="lazy"/> : <span><Store size={36}/></span>}</Link>
    <div className="biz-info"><span className="eyebrow">{b.category.name}</span><h3><Link to={'/negocio/' + encodeURIComponent(b.slug)}>{b.name}</Link></h3>
      <p className="biz-desc">{b.description || 'Conocé este negocio local.'}</p>
      <p className="biz-district"><MapPin size={15}/>{b.district}</p>
      <div className="biz-actions"><Link to={'/negocio/' + encodeURIComponent(b.slug)}>Ver perfil <ArrowRight size={15}/></Link>
      {b.whatsApp && <a className="whatsapp" href={waUrl(b.whatsApp)} target="_blank" rel="noopener noreferrer" aria-label={'WhatsApp de ' + b.name}><MessageCircle size={18}/></a>}</div>
    </div></article>;
}
function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const district = params.get('district') || '';
  const categoryId = params.get('categoryId') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [term, setTerm] = useState(search);
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<{ items: Business[]; total: number; pageSize: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { setTerm(search); }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    directoryApi.categories(controller.signal).then(setCategories).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (district) query.set('district', district);
    if (categoryId) query.set('categoryId', categoryId);
    query.set('page', String(page)); query.set('pageSize', '12');
    directoryApi.businesses(query, controller.signal)
      .then(setData).catch(e => { if (!controller.signal.aborted) { setError((e as Error).message); setData(null); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, district, categoryId, page]);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page'); setParams(next);
  }
  const selectedCategory = categories.find(c => String(c.id) === categoryId);
  return <>
    <section className="hero"><div className="shell hero-inner"><div className="hero-content">
      <span className="hero-kicker"><span className="green-dot"/> Comercio local · Sarchí, Costa Rica</span>
      <h1>Todo lo que buscás.<br/><em>Más cerca de vos.</em></h1>
      <p>Encontrá comercios, profesionales y servicios de nuestra comunidad. Sin vueltas, sin complicaciones.</p>
      <form className="search-box" onSubmit={e => { e.preventDefault(); change('search', term.trim()); document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' }); }}>
        <Search size={22}/><input value={term} onChange={e => setTerm(e.target.value)} placeholder="¿Qué necesitás encontrar?" aria-label="Buscar negocios" maxLength={100}/><button type="submit">Buscar <ArrowRight size={17}/></button>
      </form>
      <div className="hero-tags"><span>Probá buscar:</span>{['Panadería', 'Mecánico', 'Salón de belleza'].map(t => <button key={t} onClick={() => { setTerm(t); change('search', t); }}>{t}</button>)}</div>
    </div><div className="hero-art" aria-hidden="true"><div className="art-disc"><span>🇨🇷</span></div><div className="art-note"><MapPin size={18}/> Descubrí lo local</div></div></div></section>
    <main className="shell">
      <section id="categorias" className="section categories"><div className="section-head"><div><span className="eyebrow">DESCUBRÍ</span><h2>Explorá por categoría</h2></div><p>Encontrá lo que necesitás en nuestro cantón.</p></div>
      <div className="category-grid">{tiles.map(t => { const cat = categories.find(c => c.slug === t.key); return <button className={'category-tile ' + (cat && String(cat.id) === categoryId ? 'active' : '')} key={t.key} onClick={() => { if (cat) change('categoryId', String(cat.id)); else { change('search', t.label); } }}>
        <span className="category-emoji">{t.emoji}</span><span>{t.label}</span><ArrowRight size={15}/>
      </button>; })}</div>
      </section>
      <section id="resultados" className="section listings"><div className="section-head"><div><span className="eyebrow">NEGOCIOS DE NUESTRA COMUNIDAD</span><h2>Conocé lo que hay cerca</h2></div><select aria-label="Filtrar por distrito" value={district} onChange={e => change('district', e.target.value)}><option value="">Todos los distritos</option>{districts.map(d => <option key={d}>{d}</option>)}</select></div>
      {(search || district || categoryId) && <div className="filter-summary"><span>Filtros activos: {[search, district, selectedCategory?.name].filter(Boolean).join(' · ')}</span><button onClick={() => setParams(new URLSearchParams())}>Limpiar filtros <X size={14}/></button></div>}
      {loading ? <div className="card-grid" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton-card"><div/><span/><span/><span/></div>)}</div>
        : error ? <div className="empty-state"><Store size={36}/><h3>No pudimos cargar el directorio</h3><p>{error}</p><button onClick={() => { setParams(new URLSearchParams(params)); window.location.reload(); }}>Intentar nuevamente</button></div>
        : data?.items.length ? <><div className="results-count">{data.total} {data.total === 1 ? 'negocio encontrado' : 'negocios encontrados'}</div><div className="card-grid">{data.items.map(b => <BusinessCard key={b.id} b={b}/>)}</div>
          <div className="pagination"><button disabled={page === 1} onClick={() => changePage(page - 1)}>Anterior</button><span>Página {page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button disabled={page * data.pageSize >= data.total} onClick={() => changePage(page + 1)}>Siguiente</button></div></>
        : <div className="empty-state"><Search size={36}/><h3>Aún no encontramos negocios con estos filtros</h3><p>Probá otra palabra o explorá los demás distritos de Sarchí.</p><button onClick={() => setParams(new URLSearchParams())}>Ver todos los negocios</button></div>}
      </section>
      <section className="join-banner"><div><span className="eyebrow light">CREZCAMOS JUNTOS</span><h2>¿Tenés un negocio en Sarchí?</h2><p>Queremos que más personas conozcan lo que hacés. Registrá tu negocio gratis y ayudanos a conectar Sarchí.</p></div><Link className="join-pill" to="/registrar-negocio">Registrar negocio <ArrowRight size={17}/></Link></section>
    </main>
  </>;
  function changePage(n: number) { const next = new URLSearchParams(params); next.set('page', String(n)); setParams(next); document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' }); }
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
