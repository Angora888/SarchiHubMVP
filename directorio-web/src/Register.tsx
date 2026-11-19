import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Store } from 'lucide-react';
import { directoryApi, type Category } from './api';
import { LocationPicker } from './LocationPicker';

const districts = ['Sarchí Norte','Sarchí Sur','Toro Amarillo','San Pedro','Rodríguez'];
// Informational list shown while the API module is not yet deployed.
// Category IDs for submissions MUST always come from the API.
const previewCategories: Category[] = [
  { id:-1, slug:'comida', name:'Comida y restaurantes' },
  { id:-2, slug:'belleza', name:'Belleza y bienestar' },
  { id:-3, slug:'talleres', name:'Talleres y mecánica' },
  { id:-4, slug:'tiendas', name:'Tiendas y comercio' },
  { id:-5, slug:'artesanias', name:'Muebles y artesanías' },
  { id:-6, slug:'salud', name:'Salud' },
  { id:-7, slug:'turismo', name:'Turismo' },
  { id:-8, slug:'servicios', name:'Servicios profesionales' }
];
type Submission = { name:string; categoryId:number; district:string; description:string; address:string; phone:string; whatsApp:string; contactEmail:string; website:string; mapsUrl:string };
const initial: Submission = {name:'',categoryId:0,district:'',description:'',address:'',phone:'',whatsApp:'',contactEmail:'',website:'',mapsUrl:''};
export default function Register() {
  const [form,setForm] = useState(initial);
  const [categories,setCategories] = useState<Category[]>(previewCategories);
  const [categoriesOnline,setCategoriesOnline] = useState(false);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [consent,setConsent] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    directoryApi.categories(controller.signal)
      .then(items => { setCategories(items); setCategoriesOnline(true); })
      .catch(() => { if (!controller.signal.aborted) { setCategories(previewCategories); setCategoriesOnline(false); } });
    return () => controller.abort();
  },[]);
  const change = (key:keyof Submission, value:string|number) => setForm(old=>({...old,[key]:value}));
  async function submit(e:FormEvent) {
    e.preventDefault(); setError('');setMessage('');
    if (!categoriesOnline) {setError('El registro estará disponible cuando se habilite la API del directorio.');return;}
    if (!consent) {setError('Confirmá que tenés autorización para publicar los datos comerciales.');return;}
    setLoading(true);
    try {
      const result=await directoryApi.submit(form);
      setMessage(result.message);setForm(initial);setConsent(false);
    } catch(err) { setError((err as Error).message); }
    finally {setLoading(false);}
  }
  return <main className="shell register-page">
    <Link to="/" className="back-link"><ArrowLeft size={17}/> Volver al directorio</Link>
    <div className="register-intro"><span className="eyebrow">DIRECTORIO SARCHÍ</span><h1>¡Hacé visible tu negocio!</h1><p>Registrá tu emprendimiento gratis. Revisaremos la información antes de publicarla.</p></div>
    {message ? <div className="register-success" role="status"><CheckCircle2 size={40}/><h2>¡Solicitud recibida!</h2><p>{message}</p><Link to="/">Volver al directorio</Link></div> :
    <form className="register-form" onSubmit={submit}>
      <h2><Store size={22}/> Información del comercio</h2>
      {!categoriesOnline && <p className="form-error" role="status">Podés consultar las categorías disponibles, pero el registro está temporalmente deshabilitado mientras conectamos la API. No se enviarán solicitudes.</p>}
      <label>Nombre del negocio *<input required minLength={3} maxLength={180} value={form.name} onChange={e=>change('name',e.target.value)} placeholder="Ej. Mi emprendimiento de Sarchí"/></label>
      <div className="form-pair"><label>Categoría *<select required value={form.categoryId} onChange={e=>change('categoryId',Number(e.target.value))}><option value={0}>Seleccioná una categoría</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Distrito *<select required value={form.district} onChange={e=>change('district',e.target.value)}><option value="">Seleccioná un distrito</option>{districts.map(d=><option key={d}>{d}</option>)}</select></label></div>
      <label>Descripción del negocio<textarea maxLength={1000} rows={4} value={form.description} onChange={e=>change('description',e.target.value)} placeholder="Contanos qué productos o servicios ofrecés."/></label>
      <label>Dirección o señas<textarea rows={2} maxLength={250} value={form.address} onChange={e=>change('address',e.target.value)} placeholder="Ubicación del negocio en Sarchí"/></label>
      <div className="form-pair"><label>Teléfono<input type="tel" maxLength={40} value={form.phone} onChange={e=>change('phone',e.target.value)} placeholder="Ej. 2222-2222"/></label><label>WhatsApp<input type="tel" maxLength={40} value={form.whatsApp} onChange={e=>change('whatsApp',e.target.value)} placeholder="Ej. 8888-8888"/></label></div>
      <div className="location-field"><strong>Ubicación del negocio (opcional)</strong><LocationPicker value={form.mapsUrl} onChange={value=>change('mapsUrl',value)}/></div>
      <label>Sitio web (opcional)<input type="url" value={form.website} maxLength={500} onChange={e=>change('website',e.target.value)} placeholder="https://..."/></label>
      <label>Correo de contacto del responsable *<input required type="email" maxLength={254} value={form.contactEmail} onChange={e=>change('contactEmail',e.target.value)} placeholder="correo@ejemplo.com"/><small>Solo para gestionar esta solicitud. No se mostrará públicamente.</small></label>
      <label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>Confirmo que tengo autorización para enviar y publicar los datos comerciales proporcionados.</span></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button disabled={loading || !categoriesOnline || categories.length===0} type="submit">{loading?'Enviando...':!categoriesOnline?'Registro temporalmente no disponible':'Enviar solicitud de registro'}</button>
      <small>* Los negocios no se publican automáticamente; requieren revisión.</small>
    </form>}
  </main>;
}
