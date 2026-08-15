import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";
function Reportes() {
   const navigate = useNavigate();
   const obtenerFechaHoy = () => {
       const hoy = new Date();
       const year = hoy.getFullYear();
       const month = String(
           hoy.getMonth() + 1
       ).padStart(2, "0");
       const day = String(
           hoy.getDate()
       ).padStart(2, "0");
       return `${year}-${month}-${day}`;
   };
   const [fecha, setFecha] =
       useState(obtenerFechaHoy());
   const [reporte, setReporte] =
       useState(null);
   const [loading, setLoading] =
       useState(true);
   // =========================
   // CARGAR REPORTE
   // =========================
   useEffect(() => {
       cargarReporte();
   }, [fecha]);
   const cargarReporte = async () => {
       try {
           setLoading(true);
           const respuesta =
               await api.get(
                   `/Pedidos/reporte-diario?fecha=${fecha}`
               );
           setReporte(
               respuesta.data
           );
       }
       catch (error) {
           console.error(error);
           alert(
               error.response?.data ||
               "No fue posible cargar el reporte."
           );
           setReporte(null);
       }
       finally {
           setLoading(false);
       }
   };
   // =========================
   // FORMATO MONEDA
   // =========================
   const formatoMoneda = (valor) => {
       return `₡ ${Number(
           valor ?? 0
       ).toLocaleString()}`;
   };
   // =========================
   // Generar PDF
   // =========================   
   
   const generarPDF = () => {
   if (!reporte) {
       alert("No hay información para generar el reporte.");
       return;
   }
   const doc = new jsPDF();
   const moneda = (valor) =>
       `CRC ${Number(valor ?? 0).toLocaleString("es-CR")}`;
   // =========================
   // TITULO
   // =========================
   doc.setFontSize(20);
   doc.setFont("helvetica", "bold");
   doc.text(
       "Reporte Diario de Ventas",
       14,
       20
   );
   doc.setFontSize(11);
   doc.setFont(
       "helvetica",
       "normal"
   );
   doc.text(
       `Fecha: ${fecha}`,
       14,
       28
   );
   doc.setDrawColor(200);
   doc.line(
       14,
       33,
       196,
       33
   );
   // =========================
   // RESUMEN GENERAL
   // =========================
   doc.setFontSize(14);
   doc.setFont(
       "helvetica",
       "bold"
   );
   doc.text(
       "Resumen General",
       14,
       43
   );
   autoTable(doc, {
       startY: 48,
       head: [[
           "Ventas del dia",
           "Pedidos",
           "Ticket promedio"
       ]],
       body: [[
           moneda(
               reporte.totalVentas
           ),
           reporte.cantidadPedidos,
           moneda(
               Math.round(
                   reporte.ticketPromedio
               )
           )
       ]],
       theme: "grid",
       styles: {
           halign: "center"
       },
       headStyles: {
           fontStyle: "bold"
       }
   });
   // =========================
   // VENTAS POR TIPO
   // =========================
   let posicionY =
       doc.lastAutoTable.finalY + 12;
   doc.setFontSize(14);
   doc.setFont(
       "helvetica",
       "bold"
   );
   doc.text(
       "Ventas por tipo de pedido",
       14,
       posicionY
   );
   autoTable(doc, {
       startY:
           posicionY + 5,
       head: [[
           "Tipo",
           "Pedidos",
           "Participacion",
           "Total"
       ]],
       body: [
           [
               "Mesa",
               reporte
                   .tiposPedido
                   ?.mesa
                   ?.cantidad ?? 0,
               `${
                   reporte
                       .tiposPedido
                       ?.mesa
                       ?.porcentaje ?? 0
               }%`,
               moneda(
                   reporte
                       .tiposPedido
                       ?.mesa
                       ?.total
               )
           ],
           [
               "Xpress",
               reporte
                   .tiposPedido
                   ?.xpress
                   ?.cantidad ?? 0,
               `${
                   reporte
                       .tiposPedido
                       ?.xpress
                       ?.porcentaje ?? 0
               }%`,
               moneda(
                   reporte
                       .tiposPedido
                       ?.xpress
                       ?.total
               )
           ],
           [
               "Pasa a llevar",
               reporte
                   .tiposPedido
                   ?.llevar
                   ?.cantidad ?? 0,
               `${
                   reporte
                       .tiposPedido
                       ?.llevar
                       ?.porcentaje ?? 0
               }%`,
               moneda(
                   reporte
                       .tiposPedido
                       ?.llevar
                       ?.total
               )
           ]
       ],
       theme: "striped"
   });
   // =========================
   // DETALLE PEDIDOS
   // =========================
   posicionY =
       doc.lastAutoTable.finalY + 12;
   doc.setFontSize(14);
   doc.setFont(
       "helvetica",
       "bold"
   );
   doc.text(
       "Detalle de pedidos",
       14,
       posicionY
   );
   const filasPedidos =
       reporte.pedidos?.map(
           pedido => [
               `#${pedido.numeroPedido
                   .toString()
                   .padStart(3, "0")}`,
               formatoHora(
                   pedido.fecha
               ),
               pedido.tipoPedido === "Mesa"
                   ? `Mesa ${pedido.mesa}`
                   : pedido.tipoPedido === "Llevar"
                       ? "Pasa a llevar"
                       : "Xpress",
               pedido.cantidadProductos,
               pedido.cantidadExtras,
               moneda(
                   pedido.total
               )
           ]
       ) ?? [];
   autoTable(doc, {
       startY:
           posicionY + 5,
       head: [[
           "Pedido",
           "Hora",
           "Tipo",
           "Productos",
           "Extras",
           "Total"
       ]],
       body:
           filasPedidos,
       theme: "striped",
       styles: {
           fontSize: 9
       }
   });
   // =========================
   // PRODUCTOS VENDIDOS
   // =========================
   posicionY =
       doc.lastAutoTable.finalY + 12;
   doc.setFontSize(14);
   doc.setFont(
       "helvetica",
       "bold"
   );
   doc.text(
       "Productos principales vendidos",
       14,
       posicionY
   );
   const filasProductos =
       reporte.productos?.map(
           producto => [
               producto.productoId,
               producto.nombre,
               producto.unidades,
               moneda(
                   producto.monto
               )
           ]
       ) ?? [];
   autoTable(doc, {
       startY:
           posicionY + 5,
       head: [[
           "Producto ID",
           "Nombre",
           "Unidades",
           "Monto"
       ]],
       body:
           filasProductos,
       theme: "striped",
       styles: {
           fontSize: 9
       },
       columnStyles: {
           2: {
               halign: "center"
           },
           3: {
               halign: "right"
           }
       }
   });
   // =========================
   // PIE DE PAGINA
   // =========================
   const cantidadPaginas =
       doc.getNumberOfPages();
   for (
       let pagina = 1;
       pagina <= cantidadPaginas;
       pagina++
   ) {
       doc.setPage(pagina);
       doc.setFontSize(8);
       doc.setTextColor(120);
       doc.text(
           `Sin filas - Reporte de ventas | Pagina ${pagina} de ${cantidadPaginas}`,
           105,
           290,
           {
               align: "center"
           }
       );
   }
   // =========================
   // GUARDAR
   // =========================
   doc.save(
       `Reporte-Ventas-${fecha}.pdf`
   );
};
   // =========================
   // FORMATO HORA
   // =========================
   const formatoHora = (fechaUtc) => {
       if (!fechaUtc)
           return "";
       const fechaDate =
           new Date(fechaUtc);
       return fechaDate.toLocaleTimeString(
           "es-CR",
           {
               hour: "2-digit",
               minute: "2-digit"
           }
       );
   };
   // =========================
   // TIPO PEDIDO
   // =========================
   const mostrarTipoPedido = (
       pedido
   ) => {
       if (
           pedido.tipoPedido === "Mesa"
       ) {
           return (
<span className="badge bg-primary">
                   🪑 Mesa #{pedido.mesa}
</span>
           );
       }
       if (
           pedido.tipoPedido === "Xpress"
       ) {
           return (
<span className="badge bg-success">
                   🛵 Xpress
</span>
           );
       }
       if (
           pedido.tipoPedido === "Llevar"
       ) {
           return (
<span className="badge bg-warning text-dark">
                   🥡 Pasa a llevar
</span>
           );
       }
       return (
<span className="badge bg-secondary">
               {pedido.tipoPedido}
</span>
       );
   };
   // =========================
   // LOADING
   // =========================
   if (loading) {
       return (
<div className="container py-5 text-center">
<div className="spinner-border text-success"></div>
<h4 className="mt-3">
                   Cargando reporte...
</h4>
</div>
       );
   }
   return (
<div className="container py-4">
           {/* ========================= */}
           {/* HEADER */}
           {/* ========================= */}
<div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
<div>
<h2 className="fw-bold mb-1">
                       📊 Reportes
</h2>
<p className="text-muted mb-0">
                       Resumen diario de ventas
</p>
</div>
<div className="d-flex gap-2">
<button
       type="button"
       className="btn btn-success"
       onClick={generarPDF}
       disabled={
           !reporte ||
           reporte.cantidadPedidos === 0
       }
>
       📄 Generar PDF
</button>
<button
       type="button"
       className="btn btn-outline-secondary"
       onClick={() =>
           navigate("/dashboard")
       }
>
       ← Dashboard
</button>
</div>
</div>
           {/* ========================= */}
           {/* FILTRO FECHA */}
           {/* ========================= */}
<div className="card shadow-sm border-0 rounded-4 mb-4">
<div className="card-body">
<div className="row align-items-end">
<div className="col-md-5">
<label className="form-label fw-semibold">
                               📅 Fecha del reporte
</label>
<input
                               type="date"
                               className="form-control"
                               value={fecha}
                               onChange={
                                   e =>
                                       setFecha(
                                           e.target.value
                                       )
                               }
                           />
</div>
</div>
</div>
</div>
           {!reporte ? (
<div className="alert alert-warning text-center">
                   No fue posible cargar información para esta fecha.
</div>
           ) : (
<>
                   {/* ========================= */}
                   {/* RESUMEN PRINCIPAL */}
                   {/* ========================= */}
<div className="row g-3 mb-4">
                       {/* VENTAS */}
<div className="col-md-4">
<div className="card shadow border-0 rounded-4 h-100">
<div className="card-body text-center py-4">
<div className="text-muted mb-2">
                                       💰 Ventas del día
</div>
<h2 className="fw-bold text-success mb-0">
                                       {formatoMoneda(
                                           reporte.totalVentas
                                       )}
</h2>
</div>
</div>
</div>
                       {/* PEDIDOS */}
<div className="col-md-4">
<div className="card shadow border-0 rounded-4 h-100">
<div className="card-body text-center py-4">
<div className="text-muted mb-2">
                                       🧾 Pedidos
</div>
<h2 className="fw-bold mb-0">
                                       {
                                           reporte.cantidadPedidos
                                       }
</h2>
</div>
</div>
</div>
                       {/* TICKET */}
<div className="col-md-4">
<div className="card shadow border-0 rounded-4 h-100">
<div className="card-body text-center py-4">
<div className="text-muted mb-2">
                                       🎟 Ticket promedio
</div>
<h2 className="fw-bold mb-0">
                                       {
                                           formatoMoneda(
                                               Math.round(
                                                   reporte.ticketPromedio
                                               )
                                           )
                                       }
</h2>
</div>
</div>
</div>
</div>
                   {/* ========================= */}
                   {/* TIPOS DE PEDIDO */}
                   {/* ========================= */}
<div className="card shadow border-0 rounded-4 mb-4">
<div className="card-header bg-dark text-white">
<h5 className="mb-0">
                               📊 Ventas por tipo de pedido
</h5>
</div>
<div className="card-body">
<div className="row g-3">
                               {/* MESA */}
<div className="col-md-4">
<div className="border rounded-4 p-4 h-100">
<h5>
                                           🪑 Mesa
</h5>
<div className="text-muted">
                                           Pedidos
</div>
<h3>
                                           {
                                               reporte
                                                   .tiposPedido
                                                   ?.mesa
                                                   ?.cantidad ?? 0
                                           }
</h3>
<div className="text-muted">
                                           Participación
</div>
<div className="fw-semibold mb-3">
                                           {
                                               reporte
                                                   .tiposPedido
                                                   ?.mesa
                                                   ?.porcentaje ?? 0
                                           }%
</div>
<div className="text-muted">
                                           Total
</div>
<h4 className="text-success">
                                           {
                                               formatoMoneda(
                                                   reporte
                                                       .tiposPedido
                                                       ?.mesa
                                                       ?.total
                                               )
                                           }
</h4>
</div>
</div>
                               {/* XPRESS */}
<div className="col-md-4">
<div className="border rounded-4 p-4 h-100">
<h5>
                                           🛵 Xpress
</h5>
<div className="text-muted">
                                           Pedidos
</div>
<h3>
                                           {
                                               reporte
                                                   .tiposPedido
                                                   ?.xpress
                                                   ?.cantidad ?? 0
                                           }
</h3>
<div className="text-muted">
                                           Participación
</div>
<div className="fw-semibold mb-3">
                                           {
                                               reporte
                                                   .tiposPedido
                                                   ?.xpress
                                                   ?.porcentaje ?? 0
                                           }%
</div>
<div className="text-muted">
                                           Total
</div>
<h4 className="text-success">
                                           {
                                               formatoMoneda(
                                                   reporte
                                                       .tiposPedido
                                                       ?.xpress
                                                       ?.total
                                               )
                                           }
</h4>
</div>
</div>
                               {/* LLEVAR */}
<div className="col-md-4">
<div className="border rounded-4 p-4 h-100">
<h5>
                                           🥡 Pasa a llevar
</h5>
<div className="text-muted">
                                           Pedidos
</div>
<h3>
                                           {
                                               reporte
                                                   .tiposPedido
                                                   ?.llevar
                                                   ?.cantidad ?? 0
                                           }
</h3>
<div className="text-muted">
                                           Participación
</div>
<div className="fw-semibold mb-3">
                                           {
                                               reporte
                                                   .tiposPedido
                                                   ?.llevar
                                                   ?.porcentaje ?? 0
                                           }%
</div>
<div className="text-muted">
                                           Total
</div>
<h4 className="text-success">
                                           {
                                               formatoMoneda(
                                                   reporte
                                                       .tiposPedido
                                                       ?.llevar
                                                       ?.total
                                               )
                                           }
</h4>
</div>
</div>
</div>
</div>
</div>
                   {/* ========================= */}
                   {/* LECTURA RÁPIDA */}
                   {/* ========================= */}
<div className="card shadow-sm border-0 rounded-4 mb-4">
<div className="card-body">
<h5 className="fw-bold">
                               💡 Lectura rápida del día
</h5>
<ul className="mb-0">
<li>
                                   El restaurante realizó{" "}
<strong>
                                       {
                                           reporte.cantidadPedidos
                                       }
</strong>{" "}
                                   pedidos por un total de{" "}
<strong>
                                       {
                                           formatoMoneda(
                                               reporte.totalVentas
                                           )
                                       }
</strong>.
</li>
<li>
                                   El ticket promedio fue de{" "}
<strong>
                                       {
                                           formatoMoneda(
                                               Math.round(
                                                   reporte.ticketPromedio
                                               )
                                           )
                                       }
</strong>.
</li>
                               {
                                   reporte.tiposPedido?.llevar
                                       ?.cantidad > 0 && (
<li>
                                           Pasa a llevar representó{" "}
<strong>
                                               {
                                                   reporte
                                                       .tiposPedido
                                                       .llevar
                                                       .porcentaje
                                               }%
</strong>{" "}
                                           de las ventas del día.
</li>
                                   )
                               }
</ul>
</div>
</div>
                   {/* ========================= */}
                   {/* DETALLE PEDIDOS */}
                   {/* ========================= */}
<div className="card shadow border-0 rounded-4 mb-4">
<div className="card-header bg-dark text-white">
<h5 className="mb-0">
                               📋 Detalle de pedidos
</h5>
</div>
<div className="card-body p-0">
<div className="table-responsive">
<table className="table table-hover align-middle mb-0">
<thead className="table-light">
<tr>
<th>
                                               Pedido
</th>
<th>
                                               Hora
</th>
<th>
                                               Tipo
</th>
<th className="text-center">
                                               Productos
</th>
<th className="text-center">
                                               Extras
</th>
<th className="text-end">
                                               Total
</th>
</tr>
</thead>
<tbody>
                                       {
                                           reporte.pedidos?.map(
                                               pedido => (
<tr
                                                       key={
pedido.id
                                                       }
>
<td className="fw-bold">
                                                           #
                                                           {
                                                               pedido.numeroPedido
                                                                   .toString()
                                                                   .padStart(
                                                                       3,
                                                                       "0"
                                                                   )
                                                           }
</td>
<td>
                                                           {
                                                               formatoHora(
                                                                   pedido.fecha
                                                               )
                                                           }
</td>
<td>
                                                           {
                                                               mostrarTipoPedido(
                                                                   pedido
                                                               )
                                                           }
</td>
<td className="text-center">
                                                           {
                                                               pedido.cantidadProductos
                                                           }
</td>
<td className="text-center">
                                                           {
                                                               pedido.cantidadExtras >
                                                               0
                                                                   ? pedido.cantidadExtras
                                                                   : "-"
                                                           }
</td>
<td className="text-end fw-semibold">
                                                           {
                                                               formatoMoneda(
                                                                   pedido.total
                                                               )
                                                           }
</td>
</tr>
                                               )
                                           )
                                       }
                                       {
                                           reporte.pedidos?.length ===
                                               0 && (
<tr>
<td
                                                       colSpan="6"
                                                       className="text-center text-muted py-4"
>
                                                       No hay pedidos terminados para esta fecha.
</td>
</tr>
                                           )
                                       }
</tbody>
</table>
</div>
</div>
</div>
                   {/* ========================= */}
                   {/* PRODUCTOS MÁS VENDIDOS */}
                   {/* ========================= */}
<div className="card shadow border-0 rounded-4 mb-4">
<div className="card-header bg-dark text-white">
<h5 className="mb-0">
                               🏆 Productos principales vendidos
</h5>
</div>
<div className="card-body p-0">
<div className="table-responsive">
<table className="table table-hover align-middle mb-0">
<thead className="table-light">
<tr>
<th>
                                               Producto ID
</th>
<th>
                                               Nombre
</th>
<th className="text-center">
                                               Unidades
</th>
<th className="text-end">
                                               Monto
</th>
</tr>
</thead>
<tbody>
                                       {
                                           reporte.productos?.map(
                                               producto => (
<tr
                                                       key={
                                                           producto.productoId
                                                       }
>
<td>
                                                           {
                                                               producto.productoId
                                                           }
</td>
<td className="fw-semibold">
                                                           {
                                                               producto.nombre
                                                           }
</td>
<td className="text-center">
<span className="badge bg-secondary">
                                                               {
                                                                   producto.unidades
                                                               }
</span>
</td>
<td className="text-end fw-bold text-success">
                                                           {
                                                               formatoMoneda(
                                                                   producto.monto
                                                               )
                                                           }
</td>
</tr>
                                               )
                                           )
                                       }
                                       {
                                           reporte.productos?.length ===
                                               0 && (
<tr>
<td
                                                       colSpan="4"
                                                       className="text-center text-muted py-4"
>
                                                       No hay productos vendidos para esta fecha.
</td>
</tr>
                                           )
                                       }
</tbody>
</table>
</div>
</div>
</div>
</>
           )}
</div>
   );
}
export default Reportes;