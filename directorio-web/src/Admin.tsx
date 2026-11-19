import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LockKeyhole, LogOut, ShieldCheck, XCircle, ArrowUp, ArrowDown, MessageCircle, Save, Pencil, MapPin } from 'lucide-react';

type Item = {id:number;name:string;categoryId:number;mapsUrl:string|null;district:string;description:string|null;category:string;address:string|null;phone:string|null;whatsApp:string|null;contactEmail:string|null;website:string|null;status:string;sortOrder:number;createdAt:string};
type Result = {page:number;pageSize:number;total:number;items:Item[]};
const districts = ['Sarchí Norte','Sarchí Sur','Toro Amarillo','San Pedro','Rodríguez'];
type EditForm = {name:string;categoryId:number;district:string;description:string;address:string;phone:string;whatsApp:string;contactEmail:string;website:string;mapsUrl:string};
const toForm=(item:Item):EditForm=>({name:item.name,categoryId:item.categoryId,district:item.district,description:item.description||'',address:item.address||'',phone:item.phone||'',whatsApp:item.whatsApp||'',contactEmail:item.contactEmail||'',website:item.website||'',mapsUrl:item.mapsUrl||''});
const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/,'');
async function api<T>(path:string, method:string, token:string|null, body?:unknown):Promise<T>{
  if (!base) throw new Error('Falta configurar la URL de la API.');
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
  // Rate limits and infrastructure errors may have an empty or HTML response.
  const data=await response.json().catch(()=>null);
  if (!response.ok) {
    const serverMessage = data && typeof data.message === 'string' ? data.message : null;
    if (response.status === 429) throw new Error('Demasiados intentos de inicio de sesión. Esperá 15 minutos antes de volver a probar.');
    if (response.status === 401) throw new Error('Credenciales incorrectas o acceso administrativo aún no habilitado.');
    if (response.status === 403) throw new Error('Esta cuenta no tiene permisos para administrar el directorio.');
    if (response.status === 404) throw new Error('El servicio de acceso administrativo todavía no está disponible en la API.');
    if (response.status >= 500) throw new Error('El servidor está presentando un problema temporal (HTTP '+response.status+'). No es necesario cambiar tu contraseña.');
    throw new Error(serverMessage || 'No fue posible iniciar sesión (HTTP '+response.status+').');
  }
  if (!data || typeof data !== 'object') throw new Error('La API devolvió una respuesta no válida.');
  return data as T;
}
export default function Admin(){
  const [editing,setEditing]=useState<number|null>(null);
  const [editForm,setEditForm]=useState<EditForm|null>(null);
  const [categories,setCategories]=useState<{id:number;name:string}[]>([]);
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
  const [waDraft,setWaDraft]=useState<Record<number,string>>({});
  useEffect(()=>{
    if(!token) return;
    const controller=new AbortController();
    api<Result>('/api/directory/admin/businesses?status='+status+'&page='+page,'GET',token)
    .then(result=>{if(!controller.signal.aborted){setItems(result.items);setTotal(result.total);}})
    .catch(e=>{if(!controller.signal.aborted){setError((e as Error).message);if((e as Error).message.includes('sesión')) setToken(null);}});
    return ()=>controller.abort();
  },[token,status,page,refresh]);
  useEffect(()=>{if(!token)return;api<{id:number;name:string}[]>('/api/directory/categories','GET',token).then(setCategories).catch(()=>{});},[token]);
  async function saveEdit(e:FormEvent){
    e.preventDefault();if(editing===null||!editForm)return;
    setBusy(true);setError('');setNotice('');
    try{await api('/api/directory/admin/businesses/'+editing,'PUT',token,editForm);setNotice('Cambios guardados correctamente.');setEditing(null);setEditForm(null);setRefresh(n=>n+1);}
    catch(err){setError((err as Error).message);}
    finally{setBusy(false);}
  }
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
  async function move(item:Item,direction:'up'|'down'){
    setBusy(true);setError('');setNotice('');
    try{
      await api('/api/directory/admin/businesses/'+item.id+'/position','PATCH',token,{direction});
      setNotice('Orden guardado para '+item.name);
      setRefresh(n=>n+1);
    } catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }
  async function saveWhatsApp(item:Item){
    const number=(waDraft[item.id]??item.whatsApp??'').trim();
    if(!number){setError('Ingresá un número de WhatsApp antes de guardar.');return;}
    setBusy(true);setError('');setNotice('');
    try{
      await api('/api/directory/admin/businesses/'+item.id+'/whatsapp','PATCH',token,{number});
      setNotice('WhatsApp actualizado para '+item.name);
      setRefresh(n=>n+1);
    } catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }
  return <main className="shell admin-page"><Link to="/" className="back-link"><ArrowLeft size={18}/> Volver al directorio</Link>
    {!token?<div className="admin-login"><LockKeyhole size={40}/><h1>Administración del directorio</h1><p>Ingresá con tu cuenta de Sin Filas autorizada para administrar Directorio Sarchí.</p><form onSubmit={login}>
      <label>Correo de Sin Filas<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Contraseña<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy?'Ingresando...':'Iniciar sesión'}</button>
    </form></div>:
    <><div className="admin-head"><div><span className="eyebrow">PANEL PRIVADO</span><h1>Revisión de negocios</h1><p>Controlá qué comercios aparecen en Directorio Sarchí.</p></div><button className="admin-logout" onClick={()=>{setToken(null);setItems([]);setNotice('');}}><LogOut size={17}/> Cerrar sesión</button></div>
    <div className="admin-toolbar"><select aria-label="Filtrar por estado" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="Pending">Pendientes</option><option value="Published">Publicados · Ordenar</option><option value="Rejected">Rechazados</option><option value="Suspended">Suspendidos</option></select><span>{total} negocios</span><button onClick={()=>setRefresh(n=>n+1)}>Actualizar</button></div>
    {error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="admin-notice" role="status">{notice}</p>}
    <div className="admin-list">{items.length===0?<div className="empty-state"><ShieldCheck size={32}/><h2>Sin negocios en esta categoría</h2></div>:
      items.map(item=><article className="admin-business" key={item.id}><div className="admin-business-head"><div><span className="eyebrow">{item.category} · {item.district}</span><h2>{item.name}</h2></div><span className="admin-status">{item.status}</span></div>
      <p>{item.description||'Sin descripción.'}</p>
      <button type="button" disabled={busy} onClick={()=>{setEditing(editing===item.id?null:item.id);setEditForm(editing===item.id?null:toForm(item));}}><Pencil size={16}/> {editing===item.id?'Cerrar edición':'Editar negocio y ubicación'}</button>
      {editing===item.id&&editForm&&<form className="register-form" onSubmit={saveEdit}>
        <h3>Editar información del negocio</h3>
        <label>Nombre *<input required minLength={3} maxLength={180} value={editForm.name} onChange={e=>setEditForm(f=>f&&({...f,name:e.target.value}))}/></label>
        <label>Categoría *<select required value={editForm.categoryId} onChange={e=>setEditForm(f=>f&&({...f,categoryId:Number(e.target.value)}))}>{categories.length?categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>):<option value={editForm.categoryId}>{item.category}</option>}</select></label>
        <label>Distrito *<select required value={editForm.district} onChange={e=>setEditForm(f=>f&&({...f,district:e.target.value}))}>{districts.map(d=><option key={d}>{d}</option>)}</select></label>
        <label>Descripción<textarea maxLength={1000} rows={3} value={editForm.description} onChange={e=>setEditForm(f=>f&&({...f,description:e.target.value}))}/></label>
        <label>Dirección o señas<textarea maxLength={250} rows={2} value={editForm.address} onChange={e=>setEditForm(f=>f&&({...f,address:e.target.value}))}/></label>
        <label><MapPin size={16}/> Ubicación en Google Maps<input type="url" maxLength={1000} placeholder="https://maps.app.goo.gl/..." value={editForm.mapsUrl} onChange={e=>setEditForm(f=>f&&({...f,mapsUrl:e.target.value}))}/><small>En Google Maps seleccioná Compartir → Copiar enlace.</small></label>
        <label>Teléfono<input type="tel" maxLength={40} value={editForm.phone} onChange={e=>setEditForm(f=>f&&({...f,phone:e.target.value}))}/></label>
        <label>WhatsApp<input type="tel" maxLength={40} value={editForm.whatsApp} onChange={e=>setEditForm(f=>f&&({...f,whatsApp:e.target.value}))}/></label>
        <label>Correo de contacto privado<input type="email" maxLength={254} value={editForm.contactEmail} onChange={e=>setEditForm(f=>f&&({...f,contactEmail:e.target.value}))}/></label>
        <label>Sitio web<input type="url" maxLength={500} value={editForm.website} onChange={e=>setEditForm(f=>f&&({...f,website:e.target.value}))}/></label>
        <div className="admin-actions"><button type="submit" disabled={busy}><Save size={16}/> {busy?'Guardando...':'Guardar cambios'}</button><button type="button" onClick={()=>{setEditing(null);setEditForm(null);}}>Cancelar</button></div>
      </form>}
      {item.status==='Published'&&<div className="directory-order-controls"><span>Orden en la portada</span><div><button type="button" disabled={busy||(page===1&&items[0]?.id===item.id)} onClick={()=>move(item,'up')} aria-label={'Subir '+item.name}><ArrowUp size={17}/> Subir</button><button type="button" disabled={busy||(page*20>=total&&items[items.length-1]?.id===item.id)} onClick={()=>move(item,'down')} aria-label={'Bajar '+item.name}><ArrowDown size={17}/> Bajar</button></div></div>}
      <div className="directory-wa-editor"><label htmlFor={'wa-'+item.id}><MessageCircle size={16}/> WhatsApp del negocio</label><div className="directory-wa-controls"><input id={'wa-'+item.id} type="tel" inputMode="tel" value={waDraft[item.id]??item.whatsApp??''} onChange={e=>setWaDraft(d=>({...d,[item.id]:e.target.value}))} placeholder="50688888888"/><button type="button" disabled={busy||!item.phone} onClick={()=>setWaDraft(d=>({...d,[item.id]:item.phone||''}))}>Usar teléfono</button><button type="button" disabled={busy} onClick={()=>saveWhatsApp(item)}><Save size={15}/> Guardar</button></div><small>Solo asigná números confirmados para WhatsApp. El enlace abre un mensaje listo para enviar.</small></div>
      <div className="admin-details"><span>Dirección: {item.address||'No indicada'}</span>{item.mapsUrl&&<a href={item.mapsUrl} target="_blank" rel="noopener noreferrer">Ver ubicación en Google Maps</a>}<span>Teléfono: {item.phone||'No indicado'}</span><span>WhatsApp: {item.whatsApp||'No indicado'}</span><span>Contacto privado: {item.contactEmail||'No indicado'}</span><span>Fecha: {new Date(item.createdAt).toLocaleDateString('es-CR')}</span></div>
      <div className="admin-actions">{item.status!=='Published'&&<button disabled={busy} onClick={()=>review(item,'Published')}><CheckCircle2 size={17}/> Aprobar</button>}
      {item.status!=='Rejected'&&<button disabled={busy} onClick={()=>review(item,'Rejected')}><XCircle size={17}/> Rechazar</button>}
      {item.status==='Published'&&<button disabled={busy} onClick={()=>review(item,'Suspended')}>Suspender</button>}
      </div></article>)}</div><div className="pagination"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page}</span><button disabled={page*20>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div>
    </>}
  </main>;
}
