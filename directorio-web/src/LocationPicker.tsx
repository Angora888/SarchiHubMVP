import { useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';

export function coordinatesFromMapsUrl(value: string | null | undefined): [number, number] | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (!['google.com','www.google.com','maps.google.com'].includes(url.hostname)) return null;
    const query = url.searchParams.get('query') || url.searchParams.get('q');
    const match = query?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
      || url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lat = Number(match[1]), lng = Number(match[2]);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat,lng] : null;
  } catch { return null; }
}

export function LocationPicker({value,onChange}:{value:string;onChange:(url:string)=>void}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [accuracy,setAccuracy]=useState<number|null>(null);
  function locate() {
    setError('');
    if (!navigator.geolocation || !window.isSecureContext) {
      setError('La ubicación requiere HTTPS y un navegador con GPS disponible.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const {latitude,longitude,accuracy:meters}=position.coords;
        onChange('https://www.google.com/maps/search/?api=1&query='+latitude.toFixed(7)+','+longitude.toFixed(7));
        setAccuracy(Math.round(meters));setBusy(false);
      },
      err => {
        setBusy(false);
        setError(err.code===1 ? 'Permiso de ubicación denegado. Activá la ubicación del navegador e intentá de nuevo.' : 'No pudimos obtener tu ubicación. Intentá nuevamente o pegá un enlace de Google Maps.');
      },
      {enableHighAccuracy:true,timeout:16000,maximumAge:0}
    );
  }
  return <div className="location-picker">
    <button type="button" className="location-current" disabled={busy} onClick={locate}><LocateFixed size={18}/>{busy?'Obteniendo ubicación…':'Usar mi ubicación actual'}</button>
    <label>O pegá un enlace de Google Maps
      <input type="url" maxLength={1000} value={value} onChange={e=>{onChange(e.target.value);setAccuracy(null);setError('');}} placeholder="https://maps.app.goo.gl/..." />
    </label>
    {value && <div className="location-preview"><MapPin size={15}/>{coordinatesFromMapsUrl(value) ? 'Coordenadas listas para aparecer en el mapa.' : 'Enlace guardado. Para mostrar un pin exacto en el mapa, usá el botón GPS.'}</div>}
    {accuracy!==null && <small>Precisión estimada: ±{accuracy} m. Confirmá que estás físicamente en el negocio antes de guardar.</small>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <small>La ubicación se solicita solo al tocar el botón y se guarda únicamente cuando enviás el formulario.</small>
  </div>;
}
