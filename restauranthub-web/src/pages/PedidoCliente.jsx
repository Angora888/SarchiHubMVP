import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
function PedidoCliente() {
   const { id } = useParams();
   const [pedido, setPedido] = useState(null);
   const [loading, setLoading] = useState(true);
useEffect(() => {
   cargarPedido();
   const intervalo = setInterval(() => {
       cargarPedido();
   }, 3000);
   return () => clearInterval(intervalo);
}, []);
   const cargarPedido = async () => {
       try {
           const respuesta = await api.get(`/Pedidos/${id}`);
           setPedido(respuesta.data);
       }
       catch (error) {
           console.error(error);
       }
       finally {
           setLoading(false);
       }
   };
   const colorEstado = (estado) => {
       switch (estado) {
           case "Pendiente":
               return "warning";
           case "Preparando":
               return "primary";
           case "Listo":
               return "success";
           case "Terminado":
               return "secondary";
           default:
               return "dark";
       }
   };
   if (loading)
       return (
<div className="container py-5 text-center">
<div className="spinner-border text-success"></div>
<p className="mt-3">
                   Cargando pedido...
</p>
</div>
       );
   if (!pedido)
       return (
<div className="container py-5 text-center">
<h3>
                   Pedido no encontrado
</h3>
</div>
       );
   return (
<div className="container py-4">
<div className="card shadow">
<div className="card-body">
<h2 className="text-center">
                       🍽 {pedido.restaurant}
</h2>
<h5 className="text-center text-muted">
                       Mesa #{pedido.mesa}
</h5>
<h5 className="text-center text-muted">
                       Pedido #{pedido.numeroPedido.toString().padStart(3, "0")}
</h5>
<hr />
<div className="text-center mb-4">
   {pedido.estado === "Terminado" ? (
<div className="alert alert-success">
<h4>🎉 ¡Gracias por tu compra!</h4>
<p className="mb-0">
               Esperamos que hayas disfrutado tu pedido.
</p>
</div>
   ) : (
<span className={`badge bg-${colorEstado(pedido.estado)} fs-5`}>
           {pedido.estado}
</span>
   )}
</div>
<h5>
                       Productos
</h5>
                   {
                       pedido.detalles.map(detalle => (
<div
                               key={detalle.id}
                               className="border rounded p-3 mb-3"
>
<div className="d-flex justify-content-between">
<strong>
                                       {detalle.producto}
</strong>
<strong>
                                       x{detalle.cantidad}
</strong>
</div>
                               {
                                   detalle.observaciones && (
<div className="text-muted mt-2">
                                           📝 {detalle.observaciones}
</div>
                                   )
                               }
<div className="text-end mt-2">
                                   ₡ {detalle.subtotal}
</div>
</div>
                       ))
                   }
<hr />
<div className="d-flex justify-content-between fs-4">
<strong>
                           Total
</strong>
<strong>
                           ₡ {pedido.total}
</strong>
</div>
</div>
</div>
</div>
   );
}
export default PedidoCliente;