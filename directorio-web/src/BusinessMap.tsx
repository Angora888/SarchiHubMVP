import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Store, Navigation, MessageCircle } from 'lucide-react';
import { directoryApi, type Business, type Category } from './api';
import { coordinatesFromMapsUrl } from './LocationPicker';

type MapInstance = {setView:(center:[number,number],zoom:number)=>void;fitBounds:(bounds:[number,number][],options?:object)=>void;remove:()=>void};
type MarkerInstance = {addTo:(map:MapInstance)=>MarkerInstance;on:(event:string,fn:()=>void)=>MarkerInstance;remove:()=>void};
type Leaflet = {
  map:(node:HTMLElement,options?:object)=>MapInstance;
  tileLayer:(url:string,options:object)=>{addTo:(map:MapInstance)=>void};
  marker:(position:[number,number])=>MarkerInstance;
};
declare global {interface Window {L?:Leaflet}}
const SARCHI:[number,number]=[10.090, -84.347];
let leafletLoad:Promise<Leaflet>|undefined;
function loadLeaflet():Promise<Leaflet> {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletLoad) leafletLoad = new Promise<Leaflet>((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin='anonymous';
    script.onload=()=>window.L ? resolve(window.L) : reject(new Error('Mapa no disponible.'));
    script.onerror=()=>reject(new Error('No se pudo descargar el mapa.'));
    document.head.appendChild(script);
  }).catch(e=>{leafletLoad=undefined;throw e;});
  return leafletLoad!;
}
async function getAllPublished(signal:AbortSignal):Promise<Business[]> {
  const collected:Business[]=[];
  for(let page=1;page<=100;page++){
    const query=new URLSearchParams({page:String(page),pageSize:'50'});
    const response=await directoryApi.businesses(query,signal);
    collected.push(...response.items);
    if(collected.length>=response.total || response.items.length===0)break;
  }
  return collected;
}
export default function BusinessMap(){
  const [businesses,setBusinesses]=useState<Business[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [search,setSearch]=useState('');
  const [district,setDistrict]=useState('');
  const [category,setCategory]=useState('');
  const [selected,setSelected]=useState<number|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [mapError,setMapError]=useState('');
  const node=useRef<HTMLDivElement>(null);
  const map=useRef<MapInstance|null>(null);
  const markers=useRef<MarkerInstance[]>([]);
  useEffect(()=>{
    const ctrl=new AbortController();
    Promise.all([getAllPublished(ctrl.signal),directoryApi.categories(ctrl.signal)]).then(([items,cats])=>{
      if(!ctrl.signal.aborted){setBusinesses(items);setCategories(cats);}
    }).catch(e=>{if(!ctrl.signal.aborted)setError((e as Error).message);}).finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
    return ()=>ctrl.abort();
  },[]);
  const positioned=useMemo(()=>businesses.map(b=>({business:b,coords:coordinatesFromMapsUrl(b.mapsUrl)})).filter((x):x is {business:Business;coords:[number,number]}=>x.coords!==null),[businesses]);
  const visible=useMemo(()=>positioned.filter(x=>(!search||[x.business.name,x.business.description||''].join(' ').toLowerCase().includes(search.toLowerCase()))&&(!district||x.business.district===district)&&(!category||String(x.business.category.id)===category)),[positioned,search,district,category]);
  useEffect(()=>{
    let canceled=false;
    if(!node.current)return;
    loadLeaflet().then(L=>{
      if(canceled||!node.current)return;
      if(!map.current){
        map.current=L.map(node.current,{scrollWheelZoom:false});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map.current);
        map.current.setView(SARCHI,12);
      }
      markers.current.forEach(x=>x.remove());
      markers.current=visible.map(x=>L.marker(x.coords).addTo(map.current!).on('click',()=>setSelected(x.business.id)));
      if(visible.length===1)map.current.setView(visible[0].coords,16);
      else if(visible.length>1)map.current.fitBounds(visible.map(x=>x.coords),{padding:[35,35],maxZoom:15});
      else map.current.setView(SARCHI,12);
    }).catch(e=>{if(!canceled)setMapError((e as Error).message)});
    return ()=>{canceled=true};
  },[visible]);
  useEffect(()=>()=>{markers.current.forEach(m=>m.remove());map.current?.remove();map.current=null;},[]);
  const chosen=visible.find(x=>x.business.id===selected)?.business;
  return <main className="shell discovery-page">
    <Link to="/" className="back-link"><ArrowLeft size={18}/> Volver al directorio</Link>
    <div className="discovery-hero"><span className="eyebrow">EXPLORÁ SARCHÍ</span><h1>Un cantón lleno de <span>lugares por descubrir.</span></h1><p>Encontrá comercios cercanos, descubrí emprendimientos y llegá directo con el mapa de Directorio Sarchí.</p></div>
    <div className="discovery-stats"><strong>{positioned.length} ubicaciones</strong><span>{businesses.length-positioned.length} negocios aún sin coordenadas</span></div>
    <div className="discovery-filters"><label className="discovery-search"><Search size={18}/><input value={search} onChange={e=>{setSearch(e.target.value);setSelected(null)}} placeholder="Buscar lugares…" aria-label="Buscar negocios en el mapa"/></label>
      <select aria-label="Distrito" value={district} onChange={e=>{setDistrict(e.target.value);setSelected(null)}}><option value="">Todos los distritos</option>{['Sarchí Norte','Sarchí Sur','Toro Amarillo','San Pedro','Rodríguez'].map(d=><option key={d}>{d}</option>)}</select>
      <select aria-label="Categoría" value={category} onChange={e=>{setCategory(e.target.value);setSelected(null)}}><option value="">Todas las categorías</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="discovery-layout">
      <section className="discovery-map-wrap" aria-label="Mapa interactivo de Sarchí">
        <div ref={node} className="discovery-map"/>
        {mapError&&<p className="map-notice">{mapError}</p>}
        {!loading&&!error&&positioned.length===0&&<p className="map-notice">El mapa está listo. Aparecerán pines cuando los negocios registren su ubicación con el botón GPS.</p>}
      </section>
      <aside className="discovery-list">
        <h2><MapPin size={19}/> {loading?'Cargando ubicaciones…':visible.length+' lugares en el mapa'}</h2>
        {visible.map(({business:b})=><button type="button" className={'discovery-place'+(b.id===selected?' active':'')} key={b.id} onClick={()=>{setSelected(b.id);const found=positioned.find(x=>x.business.id===b.id);if(found)map.current?.setView(found.coords,16);}}>
          <span className="discovery-initial">{b.name.charAt(0)}</span><span><strong>{b.name}</strong><small>{b.category.name} · {b.district}</small></span><Navigation size={17}/></button>)}
        {!loading&&!visible.length&&<p className="discovery-empty">No hay negocios con ubicación precisa para estos filtros.</p>}
      </aside>
    </div>
    {chosen&&<div className="discovery-selected"><div><span className="eyebrow">NEGOCIO SELECCIONADO</span><h2>{chosen.name}</h2><p>{chosen.category.name} · {chosen.district}</p></div><div className="discovery-actions"><Link to={'/negocio/'+encodeURIComponent(chosen.slug)}><Store size={17}/> Ver negocio</Link>{chosen.mapsUrl&&<a href={chosen.mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17}/> Cómo llegar</a>}{chosen.phone && /^\d{8}$/.test(chosen.phone.replace(/\D/g,'')) && !chosen.phone.replace(/\D/g,'').startsWith('2454') && <a href={'https://wa.me/506'+chosen.phone.replace(/\D/g,'')} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> WhatsApp</a>}</div></div>}
    <p className="discovery-footnote">Solo se muestran pines con coordenadas verificables. Los enlaces cortos de Google Maps y las direcciones escritas no se ubican automáticamente para evitar puntos incorrectos.</p>
  </main>;
}
