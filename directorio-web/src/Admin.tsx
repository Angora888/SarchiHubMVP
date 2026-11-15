import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LockKeyhole, LogOut, ShieldCheck, XCircle } from 'lucide-react';

type Item = {id:number;name:string;district:string;description:string|null;category:string;address:string|null;phone:string|null;whatsApp:string|null;contactEmail:string|null;website:string|null;status:string;createdAt:string};
type Result = {page:number;pageSize:number;total:number;items:Item[]};
const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/,'');
async function api<T>(path:string, method:string, token:string|null, body?:unknown):Promise<T>{
  if (!base) throw new Error('Falta configurar la URL de la API.');
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({message:'Respuesta inesperada del servidor.'}));
  if (!response.ok) throw new Error(response.status===401?'La sesión expiró o las credenciales son incorrectas.':(data.message || 'Ocurrió un error.'));
  return data as T;
}
export default function Admin(){
  const [token,setToken]=useState<string|null>(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [items,setItems]=useState<Item[]>([]);
  const [status,setStatus]=useState('Pending');
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    if(!token) return;
    const controller=new AbortController();
    api<Result>('/api/directory/admin/businesses?status='+status+'&page='+page,'GET',token)
    .then(result=>{if(!controller.signal.aborted){setItems(result.items);setTotal(result.total);}})
    .catch(e=>{if(!controller.signal.aborted){setError((e as Error).message);if((e as Error).message.includes('sesión')) setToken(null);}});
    return ()=>controller.abort();
  },[token,status,page,refresh]);
  async function login(e:FormEvent){
    e.preventDefault();setError('');setBusy(true);
    try{const result=await api<{token:string}>('/api/directory/admin/login','POST',null,{email,password});setToken(result.token);setPassword('');}
    catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }
  async function review(item:Item,next:'Published'|'Rejected'|'Suspended'|'Pending'){
    let reason:string|null=null;
    if(next==='Rejected'||next==='Suspended'){reason=window.prompt('Indicá el motivo para '+next.toLowerCase()+' este negocio:');if(!reason?.trim())return;}
    else if(!window.confirm('¿Confirmás cambiar el estado de '+item.name+' a '+next+'?'))return;
    setBusy(true);setError('');setNotice('');
    try{await api('/api/directory/admin/businesses/'+item.id+'/status','PATCH',token,{status:next,reason});setNotice('Estado actualizado: '+item.name);setRefresh(n=>n+1);}
    catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }
  return <main className="shell admin-page"><Link to="/" className="back-link"><ArrowLeft size={18}/> Volver al directorio</Link>
    {!token?<div className="admin-login"><LockKeyhole size={40}/><h1>Administración del directorio</h1><p>Acceso reservado para la moderación de negocios de Sarchí.</p><form onSubmit={login}>
      <label>Correo administrativo<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Contraseña<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy?'Ingresando...':'Iniciar sesión'}</button>
    </form></div>:
    <><div className="admin-head"><div><span className="eyebrow">PANEL PRIVADO</span><h1>Revisión de negocios</h1><p>Controlá qué comercios aparecen en Directorio Sarchí.</p></div><button className="admin-logout" onClick={()=>{setToken(null);setItems([]);setNotice('');}}><LogOut size={17}/> Cerrar sesión</button></div>
    <div className="admin-toolbar"><select aria-label="Filtrar por estado" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="Pending">Pendientes</option><option value="Published">Publicados</option><option value="Rejected">Rechazados</option><option value="Suspended">Suspendidos</option></select><span>{total} solicitudes</span><button onClick={()=>setRefresh(n=>n+1)}>Actualizar</button></div>
    {error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="admin-notice" role="status">{notice}</p>}
    <div className="admin-list">{items.length===0?<div className="empty-state"><ShieldCheck size={32}/><h2>Sin negocios en esta categoría</h2></div>:
      items.map(item=><article className="admin-business" key={item.id}><div className="admin-business-head"><div><span className="eyebrow">{item.category} · {item.district}</span><h2>{item.name}</h2></div><span className="admin-status">{item.status}</span></div>
      <p>{item.description||'Sin descripción.'}</p><div className="admin-details"><span>Dirección: {item.address||'No indicada'}</span><span>Teléfono: {item.phone||'No indicado'}</span><span>WhatsApp: {item.whatsApp||'No indicado'}</span><span>Contacto privado: {item.contactEmail||'No indicado'}</span><span>Fecha: {new Date(item.createdAt).toLocaleDateString('es-CR')}</span></div>
      <div className="admin-actions">{item.status!=='Published'&&<button disabled={busy} onClick={()=>review(item,'Published')}><CheckCircle2 size={17}/> Aprobar</button>}
      {item.status!=='Rejected'&&<button disabled={busy} onClick={()=>review(item,'Rejected')}><XCircle size={17}/> Rechazar</button>}
      {item.status==='Published'&&<button disabled={busy} onClick={()=>review(item,'Suspended')}>Suspender</button>}
      </div></article>)}</div><div className="pagination"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page}</span><button disabled={page*20>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div>
    </>}
  </main>;
}
