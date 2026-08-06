import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { API_URL } from "../config";
function PublicMenu(){
   const { id } = useParams();
   const [restaurant,setRestaurant]=useState(null);
   const [categorias,setCategorias]=useState([]);
   useEffect(()=>{
       cargarMenu();
   },[]);
   const cargarMenu=async()=>{
       const respuesta =
           await api.get(`/Menu/restaurant/${id}`);
       setRestaurant(respuesta.data.restaurant);
       setCategorias(respuesta.data.categorias);
   }
   if(!restaurant){
       return <p className="text-center mt-5">Cargando...</p>;
   }
   return(
<div className="container py-5">
<div className="text-center mb-5">
<img
src={`${API_URL}/${restaurant.imageUrl}`}
className="img-fluid rounded shadow"
style={{
maxHeight:280,
objectFit:"cover"
}}
/>
<h1 className="mt-4">
{restaurant.name}
</h1>
<p className="text-muted">
{restaurant.description}
</p>
</div>
{
categorias.map(categoria=>(
<div
key={categoria.id}
className="mb-5"
>
<div className="d-flex justify-content-between align-items-center bg-light rounded-3 p-3 mb-3">
<h4 className="mb-0 fw-bold">
       🍽️ {categoria.name}
</h4>
<span className="badge bg-success">
       {categoria.productos.length} productos
</span>
</div>
<div className="row g-3">
{
categoria.productos.map(producto=>(
<div className="card border-0 shadow-sm rounded-4 h-100">
<div className="card-body">
<div className="d-flex justify-content-between align-items-start">
<div className="pe-3 flex-grow-1">
<h6 className="fw-bold mb-1">
                   {producto.nombre}
</h6>
<small className="text-muted d-block mb-2">
                   {producto.descripcion}
</small>
<span className="fw-bold fs-5 text-success">
                   ₡ {producto.precio}
</span>
</div>
           {
               producto.imagenUrl &&
<img
                   src={`${API_URL}/${producto.imagenUrl}`}
                   alt={producto.nombre}
                   style={{
                       width: 90,
                       height: 90,
                       objectFit: "cover",
                       borderRadius: 12
                   }}
               />
           }
</div>
</div>
</div>
))
}
</div>
</div>
))
}
</div>
   )
}
export default PublicMenu;