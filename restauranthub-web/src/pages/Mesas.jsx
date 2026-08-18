import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";
function Mesas() {
   const [mesas, setMesas] = useState([]);
   const [busqueda, setBusqueda] = useState("");
   const {
       toast,
       showToast,
       hideToast
   } = useToast();
   const [
       mesaSeleccionada,
       setMesaSeleccionada
   ] = useState(null);
   const [
       mostrarQR,
       setMostrarQR
   ] = useState(false);
   const navigate = useNavigate();
   useEffect(() => {
       cargarMesas();
   }, []);
   // ==========================================
   // CARGAR MESAS
   // ==========================================
   const cargarMesas = async () => {
       try {
           const respuesta =
               await api.get(
                   "/Mesas/admin"
               );
           setMesas(
               respuesta.data
           );
       }
       catch (error) {
           console.error(
               "Error cargando mesas:",
               error
           );
           showToast(
               "No fue posible cargar las mesas.",
               "error"
           );
       }
   };
   // ==========================================
   // FILTRO
   // ==========================================
   const mesasFiltradas =
       mesas.filter(mesa => {
           const numero =
               mesa.number
                   ?.toString() ?? "";
           const restaurante =
               mesa.restaurante
                   ?.toLowerCase() ?? "";
           const texto =
               busqueda
                   .toLowerCase()
                   .trim();
           return (
               numero.includes(texto) ||
               restaurante.includes(texto)
           );
       });
   // ==========================================
   // GUARDAR CAMBIOS
   // ==========================================
   const guardarMesa = async (mesa) => {
       try {
           await api.put(
               `/Mesas/${mesa.id}`,
               mesa
           );
       }
       catch (error) {
           console.error(
               "Error actualizando mesa:",
               error
           );
           showToast(
               error.response?.data ||
               "No fue posible actualizar la mesa.",
               "error"
           );
           /*
            * Recargamos para restaurar
            * el valor real de BD si falló.
            */
           cargarMesas();
       }
   };
   // ==========================================
   // CAMBIAR VALOR LOCAL
   // ==========================================
   const cambiarValor = (
       id,
       campo,
       valor
   ) => {
       setMesas(prev =>
           prev.map(mesa =>
mesa.id === id
                   ? {
                       ...mesa,
                       [campo]: valor
                   }
                   : mesa
           )
       );
   };
   // ==========================================
   // IMPRIMIR QR
   // ==========================================
   const imprimirQR = () => {
       const contenido =
           document.getElementById(
               "tarjetaQR"
           )?.innerHTML;
       if (!contenido) {
           showToast(
               "No fue posible generar el QR.",
               "error"
           );
           return;
       }
       const ventana =
           window.open(
               "",
               "",
               "width=500,height=700"
           );
       if (!ventana) {
           showToast(
               "El navegador bloqueó la ventana de impresión.",
               "warning"
           );
           return;
       }
       ventana.document.write(`
<html>
<head>
<title>QR Mesa</title>
<style>
                       body {
                           display: flex;
                           justify-content: center;
                           align-items: center;
                           min-height: 100vh;
                           font-family: Arial;
                           text-align: center;
                       }
                       svg {
                           width: 250px;
                           height: 250px;
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
       setTimeout(() => {
           ventana.focus();
           ventana.print();
           ventana.close();
       }, 300);
   };
   return (
<div className="container">
           {/* ====================================== */}
           {/* HEADER */}
           {/* ====================================== */}
<div className="d-flex justify-content-between align-items-center mb-4">
<div>
<h2 className="fw-bold mb-1">
                       🍽️ Mesas
</h2>
<p className="text-muted mb-0">
                       Administra las mesas de tu restaurante
</p>
</div>
<button
                   type="button"
                   className="btn btn-success"
                   onClick={() =>
                       navigate("/mesas/nuevo")
                   }
>
<i className="bi bi-plus-circle me-2"></i>
                   Nueva Mesa
</button>
</div>
           {/* ====================================== */}
           {/* TABLA */}
           {/* ====================================== */}
<div className="card shadow border-0 rounded-4">
<div className="card-body">
<input
                       className="form-control mb-4"
                       placeholder="🔍 Buscar mesa..."
                       value={busqueda}
                       onChange={
                           e =>
                               setBusqueda(
                                   e.target.value
                               )
                       }
                   />
<div className="table-responsive">
<table className="table align-middle table-hover">
<thead>
<tr>
<th
                                       style={{
                                           width: "120px"
                                       }}
>
                                       Número
</th>
<th>
                                       Restaurante
</th>
<th
                                       style={{
                                           width: "130px"
                                       }}
>
                                       Código QR
</th>
<th
                                       style={{
                                           width: "120px"
                                       }}
>
                                       Activa
</th>
</tr>
</thead>
<tbody>
                               {mesasFiltradas.map(
                                   mesa => (
<tr key={mesa.id}>
                                           {/* NÚMERO */}
<td>
<input
                                                   className="form-control form-control-sm"
                                                   type="number"
                                                   value={
                                                       mesa.number
                                                   }
                                                   onChange={
                                                       e =>
                                                           cambiarValor(
mesa.id,
                                                               "number",
                                                               Number(
                                                                   e.target.value
                                                               )
                                                           )
                                                   }
                                                   onBlur={() =>
                                                       guardarMesa(
                                                           mesa
                                                       )
                                                   }
                                               />
</td>
                                           {/* RESTAURANTE */}
<td>
<span className="fw-semibold">
                                                   {mesa.restaurante}
</span>
</td>
                                           {/* QR */}
<td>
<button
                                                   type="button"
                                                   className="btn btn-outline-primary btn-sm"
                                                   onClick={() => {
                                                       setMesaSeleccionada(
                                                           mesa
                                                       );
                                                       setMostrarQR(
                                                           true
                                                       );
                                                   }}
>
<i className="bi bi-qr-code me-1"></i>
                                                   Ver
</button>
</td>
                                           {/* ACTIVA */}
<td>
<div className="form-check form-switch">
<input
                                                       className="form-check-input"
                                                       type="checkbox"
                                                       checked={
                                                           mesa.activa
                                                       }
                                                       onChange={
                                                           e => {
                                                               const activa =
                                                                   e.target.checked;
                                                               cambiarValor(
mesa.id,
                                                                   "activa",
                                                                   activa
                                                               );
                                                               guardarMesa({
                                                                   ...mesa,
                                                                   activa
                                                               });
                                                           }
                                                       }
                                                   />
</div>
</td>
</tr>
                                   )
                               )}
</tbody>
</table>
</div>
</div>
</div>
           {/* ====================================== */}
           {/* MODAL QR */}
           {/* ====================================== */}
           {mostrarQR && (
<div
                   className="modal fade show d-block"
                   tabIndex="-1"
                   style={{
                       backgroundColor:
                           "rgba(0,0,0,.5)"
                   }}
>
<div className="modal-dialog modal-dialog-centered">
<div className="modal-content">
<div className="modal-header">
<h5 className="modal-title">
                                   🍽️ Mesa #{mesaSeleccionada?.number}
</h5>
<button
                                   type="button"
                                   className="btn-close"
                                   onClick={() =>
                                       setMostrarQR(false)
                                   }
                               />
</div>
<div
                               id="tarjetaQR"
                               className="modal-body text-center"
>
<div className="border rounded-4 p-4 bg-white">
<h3 className="fw-bold">
                                       {mesaSeleccionada?.restaurante}
</h3>
<h5 className="text-muted">
                                       Mesa #{mesaSeleccionada?.number}
</h5>
<QRCode
                                       value={
                                           `https://sarchi-hub-mvp.vercel.app/menu/${mesaSeleccionada?.codigoQR}`
                                       }
                                       size={250}
                                   />
<p className="mb-0 mt-3">
                                       Escanee el código para realizar su pedido.
</p>
</div>
<small className="text-muted d-block mt-2">
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
                                   type="button"
                                   className="btn btn-secondary"
                                   onClick={() =>
                                       setMostrarQR(false)
                                   }
>
                                   Cerrar
</button>
<button
                                   type="button"
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
           )}
           {/* ====================================== */}
           {/* TOAST */}
           {/* ====================================== */}
<AppToast
               show={toast.show}
               message={toast.message}
               type={toast.type}
               onClose={hideToast}
           />
</div>
   );
}
export default Mesas;