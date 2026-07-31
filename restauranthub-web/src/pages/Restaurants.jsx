import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
function Restaurants() {
   const [restaurants, setRestaurants] = useState([]);
   const [busqueda, setBusqueda] = useState("");
   useEffect(() => {
       cargarRestaurantes();
   }, []);
   const cargarRestaurantes = async () => {
       try {
           const respuesta = await api.get("/Restaurants");
           setRestaurants(respuesta.data);
       }
       catch (error) {
           console.error(error);
       }
   };
   const eliminar = async (id) => {
       if (!window.confirm("¿Eliminar restaurante?"))
           return;
       try {
           await api.delete(`/Restaurants/${id}`);
           cargarRestaurantes();
       }
       catch (error) {
           console.error(error);
           alert("No fue posible eliminar.");
       }
   };
   const lista = restaurants.filter(r => {
       const texto = busqueda.toLowerCase();
       return (
           (r.name ?? "").toLowerCase().includes(texto) ||
           (r.address ?? "").toLowerCase().includes(texto)
       );
   });
   return (
<div className="container py-4">
<div className="d-flex justify-content-between align-items-center mb-4">
<h2>
                   Restaurantes
</h2>
<Link
                   to="/restaurantes/nuevo"
                   className="btn btn-success"
>
                   + Nuevo Restaurante
</Link>
</div>
<input
               className="form-control mb-4"
               placeholder="Buscar restaurante..."
               value={busqueda}
               onChange={(e)=>setBusqueda(e.target.value)}
           />
<div className="row">
               {
                   lista.map(r=>(
<div
                           className="col-md-6 col-lg-4 mb-4"
                           key={r.id}
>
<div className="card shadow h-100">
<img
                                   src={
                                       r.imageUrl
                                       ? `http://localhost:5281/${r.imageUrl}`
                                       : "https://placehold.co/600x350?text=Restaurante"
                                   }
                                   className="card-img-top"
                                   style={{
                                       height:220,
                                       objectFit:"cover"
                                   }}
                               />
<div className="card-body">
<h4>
                                       {r.name}
</h4>
<p>
                                       {r.description}
</p>
<p>
                                       📍 {r.address}
</p>
<p>
                                       ☎ {r.phone}
</p>
<p>
                                       ✉ {r.email}
</p>
</div>
<div className="card-footer d-flex justify-content-between">
<Link
                                       className="btn btn-warning"
                                       to={`/restaurantes/editar/${r.id}`}
>
                                       Editar
</Link>
<button
                                       className="btn btn-danger"
                                       onClick={()=>eliminar(r.id)}
>
                                       Eliminar
</button>
</div>
</div>
</div>
                   ))
               }
</div>
</div>
   );
}
export default Restaurants;