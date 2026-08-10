import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
function PedidoCliente() {
   const { id } = useParams();
   const [pedido, setPedido] = useState(null);
   const [loading, setLoading] = useState(true);
   const [mostrarProductos, setMostrarProductos] = useState(false);
const [productos, setProductos] = useState([]);
const [busqueda, setBusqueda] = useState("");
const [cantidades, setCantidades] = useState({});
const [agregando, setAgregando] = useState(false);
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
   
const cargarProductos = async () => {

    try {

        const respuesta = await api.get(
            `/Productos/productos-disponibles/${id}`
        );

        setProductos(respuesta.data);
        setMostrarProductos(true);

    }
    catch (error) {

        console.error(error);

        alert(
            error.response?.data ||
            "No fue posible cargar los productos."
        );

    }

};

const cambiarCantidad = (productoId, cambio) => {

    setCantidades(prev => {

        const actual = prev[productoId] || 1;

        return {
            ...prev,
            [productoId]: Math.max(1, actual + cambio)
        };

    });

};

const agregarProducto = async (productoId) => {

    try {

        setAgregando(true);

        const cantidad = cantidades[productoId] || 1;

        await api.post(
            `/Pedidos/${pedido.id}/agregar-producto`,
            {
                productoId,
                cantidad,
                observaciones: ""
            }
        );

        await cargarPedido();

        alert("Producto agregado al pedido. 😄");

    }
    catch (error) {

        console.error(error);

        alert(
            error.response?.data ||
            "No fue posible agregar el producto."
        );

    }
    finally {
        setAgregando(false);
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
	   const productosFiltrados = productos.filter(producto =>
    producto.nombre
        ?.toLowerCase()
        .includes(busqueda.toLowerCase())
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
{pedido.mesa ? (
    <>
        <span className="badge bg-primary mb-2">
            🪑 Mesa #{pedido.mesa}
        </span>
    </>
) : (
    <>
        <span className="badge bg-success mb-2">
            📞 Xpress
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>
    </>
)}
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
{pedido.estado !== "Terminado" && (

    <div className="card border-0 shadow-sm mt-4">

        <div className="card-body">

            <div className="text-center">

                <h5 className="fw-bold">
                    🤔 ¿Olvidaste algo?
                </h5>

                <p className="text-muted">
                    Puedes agregar más productos a tu pedido.
                </p>

                {!mostrarProductos && (

                    <button
                        className="btn btn-success"
                        onClick={cargarProductos}
                    >
                        ➕ Agregar productos
                    </button>

                )}

            </div>


            {mostrarProductos && (

                <div className="mt-4">

                    <input
                        className="form-control mb-3"
                        placeholder="🔍 Buscar producto..."
                        value={busqueda}
                        onChange={e =>
                            setBusqueda(e.target.value)
                        }
                    />


                    {productosFiltrados.map(producto => (

                        <div
                            key={producto.id}
                            className="border rounded-3 p-3 mb-2"
                        >

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <div className="fw-bold">
                                        {producto.nombre}
                                    </div>

                                    <div className="text-success fw-semibold">
                                        ₡ {producto.precio.toLocaleString()}
                                    </div>

                                </div>


                                <div className="d-flex align-items-center gap-2">

                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() =>
                                            cambiarCantidad(
                                                producto.id,
                                                -1
                                            )
                                        }
                                    >
                                        −
                                    </button>

                                    <strong>
                                        {cantidades[producto.id] || 1}
                                    </strong>

                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() =>
                                            cambiarCantidad(
                                                producto.id,
                                                1
                                            )
                                        }
                                    >
                                        +
                                    </button>

                                    <button
                                        className="btn btn-success btn-sm ms-2"
                                        disabled={agregando}
                                        onClick={() =>
                                            agregarProducto(producto.id)
                                        }
                                    >
                                        Agregar
                                    </button>

                                </div>

                            </div>

                        </div>

                    ))}


                    <div className="text-center mt-3">

                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() =>
                                setMostrarProductos(false)
                            }
                        >
                            Cerrar
                        </button>

                    </div>

                </div>

            )}

        </div>

    </div>

)}
</div>
</div>
</div>
</div>
   );
}
export default PedidoCliente;