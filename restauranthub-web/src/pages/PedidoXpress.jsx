import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
function PedidoXpress() {
   const navigate = useNavigate();
   const [telefono, setTelefono] = useState("");
   const [cliente, setCliente] = useState(null);
   const [nombre, setNombre] = useState("");
   const [direccion, setDireccion] = useState("");
   const [productos, setProductos] = useState([]);
   const [carrito, setCarrito] = useState([]);
   const [busqueda, setBusqueda] = useState("");
   const [buscandoCliente, setBuscandoCliente] = useState(false);
   const [guardandoCliente, setGuardandoCliente] = useState(false);
   const [guardandoPedido, setGuardandoPedido] = useState(false);
   // =========================
   // Cargar productos
   // =========================
   useEffect(() => {
       cargarProductos();
   }, []);
   const cargarProductos = async () => {
       try {
           const respuesta =
               await api.get("/Productos/productos-xpress");
           setProductos(respuesta.data);
       }
       catch (error) {
           console.error(error);
           alert("No fue posible cargar los productos.");
       }
   };
   // =========================
   // Buscar cliente
   // =========================
   const buscarCliente = async () => {
       if (!telefono.trim()) {
           alert("Ingrese un número de teléfono.");
           return;
       }
       try {
           setBuscandoCliente(true);
           const respuesta =
               await api.get(`/Clientes/cliente/${telefono}`);
           const encontrado = respuesta.data;
           setCliente(encontrado);
           setNombre(encontrado.nombreCompleto);
           setDireccion(encontrado.direccion);
       }
       catch (error) {
           if (error.response?.status === 404) {
               // Cliente nuevo
               setCliente(null);
               setNombre("");
               setDireccion("");
               alert(
                   "Cliente no encontrado. Complete sus datos para registrarlo."
               );
           }
           else {
               console.error(error);
               alert("No fue posible buscar el cliente.");
           }
       }
       finally {
           setBuscandoCliente(false);
       }
   };
   // =========================
   // Guardar cliente
   // =========================
   const guardarCliente = async () => {
       if (!telefono.trim()) {
           alert("Ingrese el teléfono.");
           return null;
       }
       if (!nombre.trim()) {
           alert("Ingrese el nombre.");
           return null;
       }
       if (!direccion.trim()) {
           alert("Ingrese la dirección.");
           return null;
       }
       try {
           setGuardandoCliente(true);
           const respuesta =
               await api.post("/Clientes/cliente", {
                   telefono,
                   nombreCompleto: nombre,
                   direccion
               });
           const nuevoCliente = respuesta.data;
           setCliente(nuevoCliente);
           return nuevoCliente;
       }
       catch (error) {
           console.error(error);
           alert("No fue posible guardar el cliente.");
           return null;
       }
       finally {
           setGuardandoCliente(false);
       }
   };
   // =========================
   // Agregar producto
   // =========================
   const agregarProducto = (producto) => {
       setCarrito(actual => {
           const existente =
               actual.find(p => p.productoId === producto.id);
           if (existente) {
               return actual.map(p =>
                   p.productoId === producto.id
                       ? {
                           ...p,
                           cantidad: p.cantidad + 1
                       }
                       : p
               );
           }
           return [
               ...actual,
               {
                   productoId: producto.id,
                   nombre: producto.nombre,
                   precio: producto.precio,
                   cantidad: 1,
                   observaciones: ""
               }
           ];
       });
   };
   // =========================
   // Cambiar cantidad
   // =========================
   const cambiarCantidad = (productoId, cantidad) => {
       if (cantidad <= 0) {
           setCarrito(actual =>
               actual.filter(p =>
                   p.productoId !== productoId
               )
           );
           return;
       }
       setCarrito(actual =>
           actual.map(p =>
               p.productoId === productoId
                   ? {
                       ...p,
                       cantidad
                   }
                   : p
           )
       );
   };
   // =========================
   // Observaciones
   // =========================
   const cambiarObservaciones = (productoId, observaciones) => {
       setCarrito(actual =>
           actual.map(p =>
               p.productoId === productoId
                   ? {
                       ...p,
                       observaciones
                   }
                   : p
           )
       );
   };
   // =========================
   // Total
   // =========================
   const total = carrito.reduce(
       (suma, producto) =>
           suma + producto.precio * producto.cantidad,
       0
   );
   // =========================
   // Crear pedido
   // =========================
   const crearPedido = async () => {
       if (!telefono.trim()) {
           alert("Ingrese el teléfono del cliente.");
           return;
       }
       if (!nombre.trim() || !direccion.trim()) {
           alert(
               "Complete el nombre y la dirección del cliente."
           );
           return;
       }
       if (carrito.length === 0) {
           alert(
               "Debe agregar al menos un producto."
           );
           return;
       }
       try {
           setGuardandoPedido(true);
           // Si todavía no tenemos cliente,
           // primero lo creamos.
           let clienteActual = cliente;
           if (!clienteActual) {
               clienteActual =
                   await guardarCliente();
               if (!clienteActual)
                   return;
           }
           const dto = {
               mesaId: null,
               clienteId: clienteActual.id,
               productos: carrito.map(p => ({
                   productoId: p.productoId,
                   cantidad: p.cantidad,
                   observaciones: p.observaciones
               }))
           };
           const respuesta =
               await api.post("/Pedidos", dto);
           alert(
               `Pedido #${respuesta.data.numeroPedido} creado correctamente.`
           );
           // Limpiar formulario
           setTelefono("");
           setCliente(null);
           setNombre("");
           setDireccion("");
           setCarrito("");
           navigate("/pedidos");
       }
       catch (error) {
           console.error(error);
           alert(
               error.response?.data ||
               "No fue posible crear el pedido."
           );
       }
       finally {
           setGuardandoPedido(false);
       }
   };
   // =========================
   // Filtrar productos
   // =========================
   const productosFiltrados =
       productos.filter(p => {
           const texto =
               busqueda.toLowerCase();
           return (
               p.nombre?.toLowerCase().includes(texto) ||
               p.categoria?.toLowerCase().includes(texto)
           );
       });
   return (
<div className="container py-4">
           {/* HEADER */}
<div className="d-flex justify-content-between align-items-center mb-4">
<div>
<h2 className="mb-1">
                       📞 Pedido Xpress
</h2>
<p className="text-muted mb-0">
                       Crear un pedido para un cliente por teléfono.
</p>
</div>
<button
                   className="btn btn-outline-secondary"
                   onClick={() => navigate("/pedidos")}
>
                   ← Pedidos
</button>
</div>

           {/* CLIENTE */}
<div className="card shadow-sm border-0 mb-4">
<div className="card-header bg-success text-white">
<h5 className="mb-0">
                       👤 Información del cliente
</h5>
</div>
<div className="card-body">
<div className="row g-3">
<div className="col-md-5">
<label className="form-label">
                               Teléfono
</label>
<div className="input-group">
<input
                                   type="text"
                                   className="form-control"
                                   placeholder="Ej. 88888888"
                                   value={telefono}
                                   onChange={e =>
                                       setTelefono(e.target.value)
                                   }
                               />
<button
                                   className="btn btn-success"
                                   onClick={buscarCliente}
                                   disabled={buscandoCliente}
>
                                   {buscandoCliente
                                       ? "Buscando..."
                                       : "🔍 Buscar"}
</button>
</div>
</div>

<div className="col-md-7">
                           {cliente && (
<div className="alert alert-success mb-0">
<strong>
                                       ✓ Cliente encontrado
</strong>
<br />
                                   {cliente.nombreCompleto}
<br />
<small>
                                       📍 {cliente.direccion}
</small>
</div>
                           )}
                           {!cliente && telefono && (
<div className="alert alert-warning mb-0">
                                   🆕 Cliente nuevo
</div>
                           )}
</div>

<div className="col-md-5">
    <label className="form-label">
        Nombre completo
    </label>

    <input
        className="form-control"
        value={nombre}
        onChange={e =>
            setNombre(e.target.value)
        }
        placeholder="Nombre del cliente"
    />
</div>

<div className="col-12">
    <label className="form-label">
        Dirección
    </label>

    <textarea
        className="form-control"
        rows="3"
        value={direccion}
        onChange={e =>
            setDireccion(e.target.value)
        }
        placeholder="Dirección de entrega"
    />
</div>
</div>
</div>
</div>

<div className="row">
               {/* PRODUCTOS */}
<div className="col-lg-7">
<div className="card shadow-sm border-0">
<div className="card-header">
<div className="d-flex justify-content-between align-items-center">
<h5 className="mb-0">
                                   🍔 Productos
</h5>
<span className="badge bg-success">
                                   {productos.length}
</span>
</div>
</div>

<div className="card-body">
<input
                               className="form-control mb-3"
                               placeholder="🔍 Buscar producto..."
                               value={busqueda}
                               onChange={e =>
                                   setBusqueda(e.target.value)
                               }
                           />

<div className="row g-2">
                               {productosFiltrados.map(producto => (
<div
                                       className="col-md-6"
                                       key={producto.id}
>
<button
                                           type="button"
                                           className="btn btn-outline-success w-100 text-start p-3 h-100"
                                           onClick={() =>
                                               agregarProducto(producto)
                                           }
>
<strong>
                                               {producto.nombre}
</strong>
<br />
<span className="text-success">
                                               ₡ {producto.precio.toLocaleString()}
</span>
                                           {producto.categoria && (
<small className="d-block text-muted">
                                                   {producto.categoria}
</small>
                                           )}
</button>
</div>
                               ))}
</div>
                           {productosFiltrados.length === 0 && (
<p className="text-center text-muted mt-4">
                                   No se encontraron productos.
</p>
                           )}
</div>
</div>
</div>

               {/* PEDIDO */}
<div className="col-lg-5 mt-4 mt-lg-0">
<div className="card shadow border-0">
<div className="card-header bg-dark text-white">
<h5 className="mb-0">
                               🛒 Pedido
</h5>
</div>

<div className="card-body">
                           {carrito.length === 0 ? (
<div className="text-center text-muted py-4">
<div style={{ fontSize: "3rem" }}>
                                       🛒
</div>
<p className="mb-0">
                                       Agregue productos al pedido.
</p>
</div>
                           ) : (
                               carrito.map(producto => (
<div
                                       key={producto.productoId}
                                       className="border-bottom pb-3 mb-3"
>
<div className="d-flex justify-content-between">
<strong>
                                               {producto.nombre}
</strong>
<span className="text-success fw-bold">
                                               ₡ {(producto.precio * producto.cantidad).toLocaleString()}
</span>
</div>

<div className="d-flex align-items-center mt-2">
<button
                                               className="btn btn-outline-secondary btn-sm"
                                               onClick={() =>
                                                   cambiarCantidad(
                                                       producto.productoId,
                                                       producto.cantidad - 1
                                                   )
                                               }
>
                                               −
</button>
<span className="mx-3 fw-bold">
                                               {producto.cantidad}
</span>
<button
                                               className="btn btn-outline-success btn-sm"
                                               onClick={() =>
                                                   cambiarCantidad(
                                                       producto.productoId,
                                                       producto.cantidad + 1
                                                   )
                                               }
>
                                               +
</button>
</div>

<input
                                           className="form-control form-control-sm mt-2"
                                           placeholder="Observaciones..."
                                           value={producto.observaciones}
                                           onChange={e =>
                                               cambiarObservaciones(
                                                   producto.productoId,
                                                   e.target.value
                                               )
                                           }
                                       />
</div>
                               ))
                           )}

<div className="d-flex justify-content-between border-top pt-3">
<strong>
                                   Total
</strong>
<strong className="text-success fs-4">
                                   ₡ {total.toLocaleString()}
</strong>
</div>

<button
                               className="btn btn-success btn-lg w-100 mt-3"
                               onClick={crearPedido}
                               disabled={
                                   guardandoPedido ||
                                   carrito.length === 0
                               }
>
                               {guardandoPedido
                                   ? "Creando pedido..."
                                   : "📞 Crear Pedido Xpress"}
</button>
</div>
</div>
</div>
</div>
</div>
   );
}
export default PedidoXpress;