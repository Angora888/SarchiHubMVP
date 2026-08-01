import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import {useNavigate} from "react-router-dom"
function MenuPublico() {
   const { codigoQr } = useParams();
   const [restaurant, setRestaurant] = useState(null);
   const [mesa, setMesa] = useState(null);
   const [productos, setProductos] = useState([]);
   const [loading, setLoading] = useState(true);
   const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");
   const navigate = useNavigate();
   useEffect(() => {
       cargarMenu();
   }, []);
   const cargarMenu = async () => {
       try {
           const respuesta = await api.get(`/Menu/${codigoQr}`);
           setRestaurant(respuesta.data.restaurant);
           setMesa(respuesta.data.mesa);
           const productosConCantidad =
               respuesta.data.productos.map(p => ({
                   ...p,
                   cantidad: 0,
                   observaciones: ""
               }));
           setProductos(productosConCantidad);
       }
       catch (error) {
           console.error(error);
       }
       finally {
           setLoading(false);
       }
   };
   const cambiarCantidad = (id, valor) => {
       setProductos(productos.map(p => {
           if (p.id !== id)
               return p;
           return {
               ...p,
               cantidad: Math.max(0, p.cantidad + valor)
           };
       }));
   };
   const actualizarObservacion = (id, texto) => {
       setProductos(productos.map(p => {
           if (p.id !== id)
               return p;
           return {
               ...p,
               observaciones: texto
           };
       }));
   };
   const enviarPedido = async () => {
       const productosPedido = productos
           .filter(p => p.cantidad > 0)
           .map(p => ({
               productoId: p.id,
               cantidad: p.cantidad,
               observaciones: p.observaciones
           }));
       if (productosPedido.length === 0) {
           alert("Seleccione al menos un producto.");
           return;
       }
       const pedido = {
           mesaId: mesa.id,
           productos: productosPedido
       };
       console.log("Pedido enviado:");
       console.log(JSON.stringify(pedido, null, 2));
       try {
			const respuesta = await api.post("/Pedidos", pedido);
			navigate(`/pedido/${respuesta.data.pedidoId}`);
           setProductos(productos.map(p => ({
               ...p,
               cantidad: 0,
               observaciones: ""
           })));
       }
       catch (error) {
           console.error(error);
           console.log(error.response);
           alert("No fue posible enviar el pedido.");
       }
   };
   const total = productos.reduce(
       (suma, p) => suma + (p.precio * p.cantidad),
       0
   );
   const articulos = productos.reduce(
       (suma, p) => suma + p.cantidad,
       0
   );
   
const categorias = [
   "Todos",
   ...new Set(
       productos
           .map(p => p.categoriaNombre)
           .filter(c => c && c.trim() !== "")
   )
];
const productosFiltrados = productos.filter(p => {
   if (categoriaSeleccionada === "Todos")
       return true;
   return p.categoriaNombre === categoriaSeleccionada;
});
   if (loading)
       return (
<h3 className="text-center mt-5">
               Cargando...
</h3>
       );
   return (
<div className="container py-4">
<div className="text-center mb-4">
<h2>{restaurant.name}</h2>
<h5>Mesa #{mesa.number}</h5>
<div className="d-flex flex-wrap gap-2 justify-content-center mt-4 mb-4">
   {categorias.map((categoria) => (
<button
           key={categoria}
           className={
               categoriaSeleccionada === categoria
                   ? "btn btn-success"
                   : "btn btn-outline-success"
           }
           onClick={() => setCategoriaSeleccionada(categoria)}
>
           {categoria}
</button>
   ))}
</div>
</div>
<div className="row">
               {
                   productosFiltrados.map(producto => (
<div
                           className="col-12 mb-4"
                           key={producto.id}
>
<div className="card shadow">
<div className="card-body">
<h4>
                                       {producto.nombre}
</h4>
<p>
                                       {producto.descripcion}
</p>
<h5>
                                       ₡ {producto.precio}
</h5>
<textarea
                                       className="form-control mt-3"
                                       rows="2"
                                       placeholder="Ej. Sin cebolla, extra queso..."
                                       value={producto.observaciones}
                                       onChange={(e) =>
                                           actualizarObservacion(
producto.id,
                                               e.target.value
                                           )
                                       }
                                   />
<div className="d-flex justify-content-center align-items-center mt-3">
<button
                                           className="btn btn-danger"
                                           onClick={() =>
                                               cambiarCantidad(producto.id, -1)
                                           }
>
                                           -
</button>
<h4 className="mx-4">
                                           {producto.cantidad}
</h4>
<button
                                           className="btn btn-success"
                                           onClick={() =>
                                               cambiarCantidad(producto.id, 1)
                                           }
>
                                           +
</button>
</div>
</div>
</div>
</div>
                   ))
               }
</div>
<div className="sticky-bottom bg-white border-top p-3 shadow-lg">
<div className="d-flex justify-content-between">
<strong>
                       Productos:
</strong>
<strong>
                       {articulos}
</strong>
</div>
<div className="d-flex justify-content-between">
<strong>
                       Total:
</strong>
<strong>
                       ₡ {total}
</strong>
</div>
<button
                   className="btn btn-success w-100 mt-3"
                   onClick={enviarPedido}
>
                   🛒 Enviar Pedido
</button>
</div>
</div>
   );
}
export default MenuPublico;