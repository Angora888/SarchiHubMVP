import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../services/api";
function Mesas() {
	const [mesas, setMesas] = useState([]);
	const [restaurantes, setRestaurantes] = useState([]);
	const [busqueda, setBusqueda] = useState("");
	const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
const [mostrarQR, setMostrarQR] = useState(false);
		      const navigate = useNavigate();
	   useEffect(() => {
       cargarMesas();
	          cargarRestaurantes();
   }, []);
	const cargarMesas = async () => {
   const respuesta = await api.get("/Mesas/admin");
   setMesas(respuesta.data);
}
	const cargarRestaurantes = async () => {
   const respuesta = await api.get("/Restaurants");
   setRestaurantes(respuesta.data);
}

const mesasFiltradas =
mesas.filter(m =>
   m.number.toString().includes(busqueda) ||
   m.restaurante
       .toLowerCase()
       .includes(busqueda.toLowerCase())
);

const guardarMesa = async (mesa)=>{
   try{
       await api.put(
           `/Mesas/${mesa.id}`,
           mesa
       );
   }catch(error){
       console.error(error);
   }
}

const cambiarValor = (id,campo,valor)=>{
   setMesas(prev=>
       prev.map(mesa=>
mesa.id===id
           ? {...mesa,[campo]:valor}
           : mesa
       )
   );
}

const imprimirQR = () => {
const contenido =
   document.getElementById("tarjetaQR").innerHTML;
const ventana = window.open(
   "",
   "",
   "width=500,height=700"
);
ventana.document.write(`
<html>
<head>
<title>QR Mesa</title>
<style>
       body{
           display:flex;
           justify-content:center;
           align-items:center;
           height:100vh;
           font-family:Arial;
           text-align:center;
       }
       QRCode{
           width:250px;
       }
</style>
</head>
<body>
<div>
       ${contenido}
</div>
</body>
</html>
`);
ventana.document.close();
const img = ventana.document.querySelector("QRCode");
img.onload = () => {
   ventana.focus();
   ventana.print();
   ventana.close();
};
}
	
return (
<div className="container">
<div className="d-flex justify-content-between align-items-center mb-4">
<div>
<h2 className="fw-bold mb-1">
                   🍽️ Mesas
</h2>
<p className="text-muted mb-0">
                   Administra las mesas de los restaurantes
</p>
</div>
<button
               className="btn btn-success"
               onClick={() => navigate("/mesas/nuevo")}
>
<i className="bi bi-plus-circle me-2"></i>
               Nueva Mesa
</button>
</div>
<div className="card shadow border-0 rounded-4">
<div className="card-body">
<input
                   className="form-control mb-4"
                   placeholder="🔍 Buscar mesa..."
                   value={busqueda}
                   onChange={(e) => setBusqueda(e.target.value)}
               />
<table className="table align-middle table-hover">
<thead>
<tr>
<th style={{ width: "120px" }}>
                               Número
</th>
<th>
                               Restaurante
</th>
<th style={{ width: "130px" }}>
                               Código QR
</th>
<th style={{ width: "120px" }}>
                               Activa
</th>
</tr>
</thead>
<tbody>
                       {mesasFiltradas.map(mesa => (
<tr key={mesa.id}>
<td>
<input
                                       className="form-control form-control-sm"
                                       type="number"
                                       value={mesa.number}
                                       onChange={(e) =>
                                           cambiarValor(
mesa.id,
                                               "number",
                                               Number(e.target.value)
                                           )
                                       }
                                       onBlur={() => guardarMesa(mesa)}
                                   />
</td>
<td>
<select
                                       className="form-select form-select-sm"
                                       value={mesa.restaurantId}
                                       onChange={(e) => {
                                           cambiarValor(
mesa.id,
                                               "restaurantId",
                                               Number(e.target.value)
                                           );
                                           guardarMesa({
                                               ...mesa,
                                               restaurantId: Number(e.target.value)
                                           });
                                       }}
>
                                       {restaurantes.map(r => (
<option
                                               key={r.id}
                                               value={r.id}
>
                                               {r.name}
</option>
                                       ))}
</select>
</td>
<td>
<button
                                       className="btn btn-outline-primary btn-sm"
onClick={() => {
   setMesaSeleccionada(mesa);
   setMostrarQR(true);
}}
>
<i className="bi bi-qr-code me-1"></i>
                                       Ver
</button>
</td>
<td>
<div className="form-check form-switch">
<input
                                           className="form-check-input"
                                           type="checkbox"
                                           checked={mesa.activa}
                                           onChange={(e) => {
                                               cambiarValor(
mesa.id,
                                                   "activa",
                                                   e.target.checked
                                               );
                                               guardarMesa({
                                                   ...mesa,
                                                   activa: e.target.checked
                                               });
                                           }}
                                       />
</div>
</td>
</tr>
                       ))}
</tbody>
</table>
</div>
</div>
<div
   className={`modal fade ${mostrarQR ? "show d-block" : ""}`}
   tabIndex="-1"
   style={{
       backgroundColor: "rgba(0,0,0,.5)"
   }}
>
<div className="modal-dialog modal-dialog-centered">
<div className="modal-content">
<div className="modal-header">
<h5 className="modal-title">
                   🍽️ Mesa #{mesaSeleccionada?.number}
</h5>
<button
                   className="btn-close"
                   onClick={() => setMostrarQR(false)}
               />
</div>
<div    id="tarjetaQR" className="modal-body text-center">
<div

   className="border rounded-4 p-4 bg-white"
>
<h3 className="fw-bold">
       {mesaSeleccionada?.restaurante}
</h3>
<h5 className="text-muted">
       Mesa #{mesaSeleccionada?.number}
</h5>
<QRCode
   value={`https://sarchi-hub-mvp.vercel.app/menu/${mesaSeleccionada?.codigoQR}`}
   size={250}
/>
<p className="mb-0">
       Escanee el código para realizar su pedido.
</p>

</div>
<small className="text-muted d-block">
   ¿Le gustaría tener un menú digital como este?
</small>
<small className="text-muted d-block">
   Contáctenos y modernice su negocio.
</small>
<small className="fw-semibold">
   📞 6066-2375
</small>
</div>
<div className="modal-footer">
<button
                   className="btn btn-secondary"
                   onClick={() => setMostrarQR(false)}
>
                   Cerrar
</button>
<button
   className="btn btn-primary"
   onClick={imprimirQR}
>
<i className="bi bi-printer me-2"></i>
   Imprimir
</button>
</div>
</div>
</div>
</div>
</div>
);
}
export default Mesas;