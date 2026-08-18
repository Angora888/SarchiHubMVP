import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function Pedidos() {
   const [pedidos, setPedidos] = useState([]);
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [pedidoAEliminar, setPedidoAEliminar] =
       useState(null);
   const [eliminando, setEliminando] =
       useState(false);
   useEffect(() => {
       cargarPedidos();
       const intervalo = setInterval(() => {
           cargarPedidos();
       }, 3000);
       return () => clearInterval(intervalo);
   }, []);
   
		   const {
		   toast,
		   showToast,
		   hideToast
		} = useToast();
   // =========================
   // CARGAR PEDIDOS
   // =========================
   const cargarPedidos = async () => {
       try {
           const respuesta =
               await api.get("/Pedidos");
           setPedidos(respuesta.data);
       }
       catch (error) {
           console.error(error);
       }
       finally {
           setLoading(false);
       }
   };
   // =========================
   // ELIMINAR PEDIDO
   // =========================
   const confirmarEliminarPedido = (pedido) => {
       setPedidoAEliminar(pedido);
   };
   const cancelarEliminarPedido = () => {
       if (eliminando)
           return;
       setPedidoAEliminar(null);
   };
   const eliminarPedido = async () => {
       if (!pedidoAEliminar)
           return;
       try {
           setEliminando(true);
           await api.delete(
               `/Pedidos/${pedidoAEliminar.id}`
           );
           setPedidoAEliminar(null);
           await cargarPedidos();
       }
       catch (error) {
           console.error(error);

		   showToast(
			   error.response?.data || "No fue posible eliminar el pedido.",
			   "error"
			);
       }
       finally {
           setEliminando(false);
       }
   };
   // =========================
   // PRIORIDAD POR TIEMPO
   // =========================
   const colorPrioridad = (fecha) => {
       const minutos =
           Math.floor(
               (
                   new Date() -
                   new Date(fecha)
               ) / 60000
           );
       if (minutos >= 20)
           return "danger";
       if (minutos >= 10)
           return "warning";
       return "success";
   };
   // =========================
   // TIEMPO TRANSCURRIDO
   // =========================
   const tiempoTranscurrido = (fecha) => {
       const ahora =
           new Date();
       const pedido =
           new Date(fecha);
       const minutos =
           Math.floor(
               (
                   ahora -
                   pedido
               ) / 60000
           );
       if (minutos < 1)
           return "Hace unos segundos";
       if (minutos < 60)
           return `Hace ${minutos} min`;
       const horas =
           Math.floor(
               minutos / 60
           );
       if (horas < 24)
           return `Hace ${horas} h`;
       const dias =
           Math.floor(
               horas / 24
           );
       return `Hace ${dias} día(s)`;
   };
   // =========================
   // COLOR ESTADO
   // =========================
   const colorEstado = (estado) => {
       switch (estado) {
           case "Pendiente":
               return "warning";
           case "Preparando":
               return "primary";
           case "Listo":
               return "success";
           case "Terminado":
           case "Finalizado":
               return "secondary";
           default:
               return "dark";
       }
   };
   // =========================
   // PORCENTAJE PROGRESO
   // =========================
   const porcentajeEstado = (estado) => {
       switch (estado) {
           case "Pendiente":
               return "25%";
           case "Preparando":
               return "60%";
           case "Listo":
           case "Terminado":
           case "Finalizado":
               return "100%";
           default:
               return "0%";
       }
   };
   // =========================
   // LOADING
   // =========================
   if (loading) {
       return (
<div className="container py-5 text-center">
<div className="spinner-border text-success"></div>
<h5 className="mt-3">
                   Cargando pedidos...
</h5>
</div>
       );
   }
   // =========================
   // UI
   // =========================
   return (
<div className="container py-4">
<h2 className="fw-bold mb-4">
               📦 Pedidos diarios
</h2>
           {pedidos.length === 0 && (
<div className="alert alert-success text-center">
                   🎉 No hay pedidos activos.
</div>
           )}
           {pedidos.map(pedido => (
<div
                   key={pedido.id}
                   className={
                       `card shadow-sm border-0 mb-3
                       border-start border-5
                       border-${colorPrioridad(
                           pedido.fecha
                       )}`
                   }
                   role="button"
                   onClick={() =>
                       navigate(
                           `/pedido/${pedido.codigoQR}`
                       )
                   }
                   style={{
                       cursor: "pointer",
                       transition:
                           "all .25s ease"
                   }}
>
<div className="card-body">
<div className="d-flex justify-content-between align-items-start">
<div>
                               {/* NUMERO PEDIDO */}
<h5 className="fw-bold mb-1">
                                   📦 Pedido #
                                   {pedido.numeroPedido
                                       .toString()
                                       .padStart(
                                           3,
                                           "0"
                                       )}
</h5>
                               {/* TIPO PEDIDO */}
<div className="text-muted">
                                   {pedido.tipoPedido ===
                                       "Mesa" && (
<span className="badge bg-primary mb-2">
                                           🪑 Mesa #
                                           {pedido.mesa}
</span>
                                   )}
                                   {pedido.tipoPedido ===
                                       "Xpress" && (
<>
<span className="badge bg-success mb-2">
                                               🛵 Xpress
</span>
<div className="fw-semibold">
                                               👤 {
                                                   pedido
                                                       .cliente
                                                       ?.nombre
                                               }
</div>
                                           {pedido.cliente?.telefono && (
<div className="small text-muted">
                                                   📱 {
                                                       pedido
                                                           .cliente
                                                           .telefono
                                                   }
</div>
                                           )}
                                           {pedido.cliente?.direccion && (
<div className="small text-muted">
                                                   📍 {
                                                       pedido
                                                           .cliente
                                                           .direccion
                                                   }
</div>
                                           )}
</>
                                   )}
                                   {pedido.tipoPedido ===
                                       "Llevar" && (
<>
<span className="badge bg-warning text-dark mb-2">
                                               🥡 Pasa a llevar
</span>
<div className="fw-semibold">
                                               👤 {
                                                   pedido
                                                       .cliente
                                                       ?.nombre
                                               }
</div>
                                           {pedido.cliente?.telefono && (
<div className="small text-muted">
                                                   📱 {
                                                       pedido
                                                           .cliente
                                                           .telefono
                                                   }
</div>
                                           )}
<div className="small text-warning-emphasis fw-semibold">
                                               🏪 Cliente recoge en el restaurante
</div>
</>
                                   )}
</div>
                               {/* CANTIDAD */}
<div className="text-muted mt-1">
                                   🥗 {
                                       pedido
                                           .cantidadProductos
                                   } productos
</div>
                               {/* TIEMPO */}
<div className="small text-secondary">
                                   🕒 {
                                       tiempoTranscurrido(
                                           pedido.fecha
                                       )
                                   }
</div>
</div>
                           {/* ESTADO */}
<span
                               className={
                                   `badge bg-${colorEstado(
                                       pedido.estado
                                   )} fs-6`
                               }
>
                               {pedido.estado}
</span>
</div>
                       {/* PROGRESO */}
<div
                           className="progress mt-3"
                           style={{
                               height: "8px"
                           }}
>
<div
                               className={
                                   `progress-bar bg-${colorEstado(
                                       pedido.estado
                                   )}`
                               }
                               style={{
                                   width:
                                       porcentajeEstado(
                                           pedido.estado
                                       )
                               }}
                           />
</div>
<hr />
                       {/* FOOTER */}
<div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
<strong className="fs-5">
                               ₡ {
                                   Number(
                                       pedido.total ?? 0
                                   )
                                       .toLocaleString()
                               }
</strong>
                           {/* ELIMINAR */}
                           {![
                               "Listo",
                               "Terminado",
                               "Preparando"
                           ].includes(
                               pedido.estado
                           ) && (
<button
                                   type="button"
                                   className="btn btn-outline-danger btn-sm"
                                   onClick={(e) => {
                                       /*
                                        * La tarjeta completa abre
                                        * el detalle del pedido.
                                        *
                                        * Evitamos que el click
                                        * del botón haga ambas cosas.
                                        */
                                       e.stopPropagation();
                                       confirmarEliminarPedido(
                                           pedido
                                       );
                                   }}
>
                                   🗑️ Eliminar
</button>
                           )}
<span className="text-success fw-semibold">
                               Tocar para ver →
</span>
</div>
</div>
</div>
           ))}
           {/* ========================= */}
           {/* MODAL ELIMINAR */}
           {/* ========================= */}
           {pedidoAEliminar && (
<div
                   className="modal show d-block"
                   tabIndex="-1"
                   role="dialog"
                   aria-modal="true"
                   style={{
                       backgroundColor:
                           "rgba(0,0,0,.55)",
                       overflowY:
                           "auto"
                   }}
                   onClick={(e) => {
                       /*
                        * Si tocan exactamente
                        * el fondo del modal,
                        * lo cerramos.
                        */
                       if (
                           e.target ===
                           e.currentTarget
                       ) {
                           cancelarEliminarPedido();
                       }
                   }}
>
<div className="modal-dialog modal-dialog-centered">
<div className="modal-content shadow">
                           {/* HEADER */}
<div className="modal-header">
<h5 className="modal-title text-danger fw-bold">
                                   🗑️ Eliminar pedido
</h5>
<button
                                   type="button"
                                   className="btn-close"
                                   disabled={
                                       eliminando
                                   }
                                   onClick={
                                       cancelarEliminarPedido
                                   }
                               />
</div>
                           {/* BODY */}
<div className="modal-body text-center">
<div
                                   className="mb-3"
                                   style={{
                                       fontSize:
                                           "3rem"
                                   }}
>
                                   ⚠️
</div>
<h4 className="fw-bold">
                                   Pedido #
                                   {
                                       pedidoAEliminar
                                           .numeroPedido
                                           .toString()
                                           .padStart(
                                               3,
                                               "0"
                                           )
                                   }
</h4>
                               {/* TIPO */}
                               {pedidoAEliminar.tipoPedido ===
                                   "Mesa" && (
<div className="mb-2">
<span className="badge bg-primary">
                                           🪑 Mesa #
                                           {
                                               pedidoAEliminar
                                                   .mesa
                                           }
</span>
</div>
                               )}
                               {pedidoAEliminar.tipoPedido ===
                                   "Xpress" && (
<div className="mb-2">
<span className="badge bg-success">
                                           🛵 Xpress
</span>
</div>
                               )}
                               {pedidoAEliminar.tipoPedido ===
                                   "Llevar" && (
<div className="mb-2">
<span className="badge bg-warning text-dark">
                                           🥡 Pasa a llevar
</span>
</div>
                               )}
                               {/* CLIENTE */}
                               {pedidoAEliminar.cliente?.nombre && (
<div className="mt-3">
                                       👤 {
                                           pedidoAEliminar
                                               .cliente
                                               .nombre
                                       }
</div>
                               )}
                               {pedidoAEliminar.cliente?.telefono && (
<div className="small text-muted">
                                       📱 {
                                           pedidoAEliminar
                                               .cliente
                                               .telefono
                                       }
</div>
                               )}
                               {/* TOTAL */}
<h3 className="text-success fw-bold mt-3">
                                   ₡ {
                                       Number(
                                           pedidoAEliminar
                                               .total ?? 0
                                       )
                                           .toLocaleString()
                                   }
</h3>
<p className="text-muted mt-3 mb-0">
                                   ¿Seguro que deseas eliminar
                                   este pedido?
</p>
<small className="text-danger">
                                   Esta acción eliminará el pedido
                                   de la lista.
</small>
</div>
                           {/* FOOTER */}
<div className="modal-footer">
<button
                                   type="button"
                                   className="btn btn-secondary"
                                   disabled={
                                       eliminando
                                   }
                                   onClick={
                                       cancelarEliminarPedido
                                   }
>
                                   Cancelar
</button>
<button
                                   type="button"
                                   className="btn btn-danger"
                                   disabled={
                                       eliminando
                                   }
                                   onClick={
                                       eliminarPedido
                                   }
>
                                   {
                                       eliminando
                                           ? "Eliminando..."
                                           : "🗑️ Sí, eliminar"
                                   }
</button>
</div>
</div>
</div>
</div>
           )}
		   <AppToast
   show={toast.show}
   message={toast.message}
   type={toast.type}
   onClose={hideToast}
/>
</div>
   );
}
export default Pedidos;