import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
function Mesas() {
	const [mesas, setMesas] = useState([]);
	const [restaurantes, setRestaurantes] = useState([]);
	const [busqueda, setBusqueda] = useState("");
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
                                           // Lo usaremos para abrir el modal del QR
                                           console.log(mesa.codigoQR);
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
</div>
);
}
export default Mesas;