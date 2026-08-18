import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function Cliente() {
   const telefonoRef = useRef(null);
   const [telefono, setTelefono] = useState("");
   const [cliente, setCliente] = useState({
       id: 0,
       telefono: "",
       nombreCompleto: "",
       direccion: "",
       latitud: null,
       longitud: null
   });
   const [modoNuevo, setModoNuevo] = useState(false);
   const { toast, showToast, hideToast} = useToast();
   const [mensaje, setMensaje] = useState("");
   useEffect(() => {
       telefonoRef.current?.focus();
   }, []);
   useEffect(() => {
       if (telefono.length !== 8)
           return;
       const timer = setTimeout(() => {
           buscarCliente();
       }, 300);
       return () => clearTimeout(timer);
   }, [telefono]);
   const buscarCliente = async () => {
       try {
           const respuesta = await api.get(`/Clientes/telefono/${telefono}`);
           setCliente(respuesta.data);
           setModoNuevo(false);
           setMensaje("👤 Cliente encontrado");
       }
       catch {
           setCliente({
               id: 0,
               telefono,
               nombreCompleto: "",
               direccion: "",
               latitud: null,
               longitud: null
           });
           setModoNuevo(true);
           setMensaje("➕ Cliente nuevo");
       }
   };
   const guardar = async () => {
       try {
           if (modoNuevo) {
               await api.post("/Clientes", cliente);
               setMensaje("✅ Cliente registrado");
           }
           else {
               await api.put(`/Clientes/${cliente.id}`, cliente);
               setMensaje("✅ Cliente actualizado");
           }
           limpiarFormulario();
       }
       catch (error) {

		   showToast(
			   "No fue posible guardar el Cliente"  ||  error.response?.data,
			   "error"
			);
       }
   };
   const obtenerUbicacion = () => {
       navigator.geolocation.getCurrentPosition((position) => {
           setCliente(c => ({
               ...c,
               latitud: position.coords.latitude,
               longitud: position.coords.longitude
           }));
           setMensaje("📍 Ubicación guardada");
       });
   };
   const abrirMapa = () => {
       if (!cliente.latitud || !cliente.longitud)
           return;
       window.open(
           `https://www.google.com/maps?q=${cliente.latitud},${cliente.longitud}`,
           "_blank"
       );
   };
   const limpiarFormulario = () => {
       setTelefono("");
       setCliente({
           id: 0,
           telefono: "",
           nombreCompleto: "",
           direccion: "",
           latitud: null,
           longitud: null
       });
       setModoNuevo(false);
       setTimeout(() => {
           telefonoRef.current?.focus();
       }, 100);
   };
   return (
<>
<Header />
<div
               className="container py-4"
               style={{ maxWidth: "500px" }}
>
<div className="card shadow">
<div className="card-body">
<div className="mb-3">
<label className="form-label fw-bold">
                               📞 Teléfono
</label>
<input
                               ref={telefonoRef}
                               type="tel"
                               className="form-control form-control-lg"
                               placeholder="88881234"
                               maxLength={8}
                               value={telefono}
onChange={(e) => {
   const valor = e.target.value.replace(/\D/g, "");
   setTelefono(valor);
   // Si borró completamente el teléfono
   if (valor === "") {
       setCliente({
           id: 0,
           telefono: "",
           nombreCompleto: "",
           direccion: "",
           latitud: null,
           longitud: null
       });
       setModoNuevo(false);
       setMensaje("");
   }
}}
                           />
</div>
                       {mensaje &&
<div className="alert alert-info text-center">
                               {mensaje}
</div>
                       }
                       {(modoNuevo || cliente.id > 0) && (
<>
<div className="mb-3">
<label className="form-label">
                                       👤 Nombre
</label>
<input
                                       className="form-control"
                                       value={cliente.nombreCompleto}
                                       onChange={(e) =>
                                           setCliente({
                                               ...cliente,
                                               nombreCompleto: e.target.value
                                           })
                                       }
                                   />
</div>
<div className="mb-3">
<label className="form-label">
                                       📍 Dirección
</label>
<textarea
                                       rows="3"
                                       className="form-control"
                                       value={cliente.direccion}
                                       onChange={(e) =>
                                           setCliente({
                                               ...cliente,
                                               direccion: e.target.value
                                           })
                                       }
                                   />
</div>
<button
                                   className="btn btn-primary w-100 mb-2"
                                   onClick={obtenerUbicacion}
>
                                   📍 Guardar ubicación actual
</button>
                               {cliente.latitud &&
<button
                                       className="btn btn-outline-success w-100 mb-2"
                                       onClick={abrirMapa}
>
                                       🗺️ Abrir en Google Maps
</button>
                               }
<button
                                   className="btn btn-success w-100"
                                   onClick={guardar}
>
                                   💾 Guardar
</button>
</>
                       )}
</div>
</div>
<AppToast
   show={toast.show}
   message={toast.message}
   type={toast.type}
   onClose={hideToast}
/>
</div>
</>
   );
}
export default Cliente;