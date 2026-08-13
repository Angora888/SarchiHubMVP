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

    // =========================
    // MODAL EXTRAS
    // =========================

    const [productoSeleccionado, setProductoSeleccionado] =
        useState(null);

    const [extrasSeleccionados, setExtrasSeleccionados] =
        useState([]);

    // =========================
    // CARGAR PEDIDO
    // =========================

    useEffect(() => {
        cargarPedido();

        const intervalo = setInterval(() => {
            cargarPedido();
        }, 3000);

        return () => clearInterval(intervalo);
    }, []);

    const cargarPedido = async () => {
        try {
            const respuesta = await api.get(
                `/Pedidos/${id}`
            );

            setPedido(respuesta.data);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setLoading(false);
        }
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
                return "secondary";

            default:
                return "dark";
        }
    };

    // =========================
    // CARGAR PRODUCTOS
    // =========================

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

    // =========================
    // CATEGORÍAS DE EXTRAS
    // =========================

    /*
     * Las categorías utilizadas como extras
     * no se muestran como productos normales.
     */
    const categoriasExtrasIds = new Set(
        productos
            .map(p => p.categoriaExtrasId)
            .filter(id => id != null)
    );

    const productosVisibles = productos.filter(
        p => !categoriasExtrasIds.has(
            p.categoriaId
        )
    );

    // =========================
    // FILTRAR PRODUCTOS
    // =========================

    const productosFiltrados =
        productosVisibles.filter(producto => {

            const texto =
                busqueda
                    .toLowerCase()
                    .trim();

            return (
                producto.nombre
                    ?.toLowerCase()
                    .includes(texto)
            );
        });

    // =========================
    // CANTIDAD
    // =========================

    const cambiarCantidad = (
        productoId,
        cambio
    ) => {

        setCantidades(prev => {

            const actual =
                prev[productoId] || 1;

            return {
                ...prev,

                [productoId]:
                    Math.max(
                        1,
                        actual + cambio
                    )
            };
        });
    };

    // =========================
    // EXTRAS DISPONIBLES
    // =========================

    const extrasDisponibles =
        productoSeleccionado
            ? productos.filter(
                p =>
                    p.categoriaId ===
                    productoSeleccionado.categoriaExtrasId
            )
            : [];

    // =========================
    // MODAL EXTRAS
    // =========================

    const abrirExtras = (producto) => {
        setProductoSeleccionado(
            producto
        );

        setExtrasSeleccionados([]);
    };

    const cerrarExtras = () => {
        setProductoSeleccionado(null);
        setExtrasSeleccionados([]);
    };

    const seleccionarExtra = (extra) => {

        setExtrasSeleccionados(prev => {

            const existe =
                prev.some(
                    e =>
                        e.id === extra.id
                );

            if (existe) {
                return prev.filter(
                    e =>
                        e.id !== extra.id
                );
            }

            return [
                ...prev,
                extra
            ];
        });
    };

    // =========================
    // AGREGAR PRODUCTO NORMAL
    // =========================

    const agregarProductoNormal =
        async (producto) => {

            try {
                setAgregando(true);

                const cantidad =
                    cantidades[producto.id] || 1;

                await api.post(
                    `/Pedidos/${pedido.id}/agregar-producto`,
                    {
                        productoId:
                            producto.id,

                        cantidad,

                        observaciones: "",

                        extras: []
                    }
                );

                await cargarPedido();

                alert(
                    "Producto agregado al pedido. 😄"
                );
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

    // =========================
    // BOTÓN AGREGAR
    // =========================

    const agregarProducto = (
        producto
    ) => {

        /*
         * Si el producto acepta extras,
         * abrimos el modal.
         */
        if (
            producto.categoriaExtrasId != null
        ) {
            abrirExtras(producto);

            return;
        }

        agregarProductoNormal(
            producto
        );
    };

    // =========================
    // AGREGAR PERSONALIZADO
    // =========================

    const confirmarProductoConExtras =
        async () => {

            if (!productoSeleccionado)
                return;

            try {
                setAgregando(true);

                /*
                 * Los productos personalizados
                 * siempre se agregan una unidad
                 * por llamada.
                 */
                await api.post(
                    `/Pedidos/${pedido.id}/agregar-producto`,
                    {
                        productoId:
                            productoSeleccionado.id,

                        cantidad: 1,

                        observaciones: "",

                        extras:
                            extrasSeleccionados.map(
                                extra => ({
                                    productoId:
                                        extra.id,

                                    cantidad: 1
                                })
                            )
                    }
                );

                cerrarExtras();

                await cargarPedido();

                alert(
                    "Producto agregado al pedido. 😄"
                );
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

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="container py-5 text-center">

                <div className="spinner-border text-success"></div>

                <p className="mt-3">
                    Cargando pedido...
                </p>

            </div>
        );
    }

    if (!pedido) {
        return (
            <div className="container py-5 text-center">

                <h3>
                    Pedido no encontrado
                </h3>

            </div>
        );
    }

    return (
        <div className="container py-4">

            <div className="card shadow">

                <div className="card-body">

                    {/* RESTAURANTE */}

                    <h2 className="text-center">
                        🍽 {pedido.restaurant}
                    </h2>

                    {/* TIPO PEDIDO */}

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

                    {/* NUMERO PEDIDO */}

                    <h5 className="text-center text-muted">

                        Pedido #
                        {pedido.numeroPedido
                            .toString()
                            .padStart(3, "0")}

                    </h5>

                    <hr />

                    {/* ESTADO */}

                    <div className="text-center mb-4">

                        {pedido.estado ===
                            "Terminado" ? (

                            <div className="alert alert-success">

                                <h4>
                                    🎉 ¡Gracias por tu compra!
                                </h4>

                                <p className="mb-0">
                                    Esperamos que hayas disfrutado tu pedido.
                                </p>

                            </div>

                        ) : (

                            <span
                                className={
                                    `badge bg-${colorEstado(
                                        pedido.estado
                                    )} fs-5`
                                }
                            >
                                {pedido.estado}
                            </span>

                        )}

                    </div>

                    {/* PRODUCTOS DEL PEDIDO */}

                    <h5>
                        Productos
                    </h5>

                    {pedido.detalles.map(
                        detalle => {

                            const totalExtras =
                                detalle.extras?.reduce(
                                    (
                                        suma,
                                        extra
                                    ) =>
                                        suma +
                                        extra.subtotal,
                                    0
                                ) ?? 0;

                            const subtotalCompleto =
                                detalle.subtotal +
                                totalExtras;

                            return (

                                <div
                                    key={detalle.id}
                                    className="border rounded p-3 mb-3"
                                >

                                    {/* PRODUCTO */}

                                    <div className="d-flex justify-content-between">

                                        <strong>
                                            {detalle.producto}
                                        </strong>

                                        <strong>
                                            x{detalle.cantidad}
                                        </strong>

                                    </div>

                                    {/* EXTRAS */}

                                    {detalle.extras?.length > 0 && (

                                        <div className="ms-3 mt-2">

                                            {detalle.extras.map(
                                                extra => (

                                                    <div
                                                        key={extra.id}
                                                        className="d-flex justify-content-between text-success"
                                                    >

                                                        <span>
                                                            ➕ {extra.producto}
                                                        </span>

                                                        <span>
                                                            ₡ {extra.subtotal.toLocaleString()}
                                                        </span>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}

                                    {/* OBSERVACIONES */}

                                    {detalle.observaciones && (

                                        <div className="text-muted mt-2">
                                            📝 {detalle.observaciones}
                                        </div>

                                    )}

                                    {/* SUBTOTAL */}

                                    <div className="text-end mt-2 fw-semibold">

                                        ₡ {
                                            subtotalCompleto
                                                .toLocaleString()
                                        }

                                    </div>

                                </div>

                            );
                        }
                    )}

                    <hr />

                    {/* TOTAL */}

                    <div className="d-flex justify-content-between fs-4">

                        <strong>
                            Total
                        </strong>

                        <strong>
                            ₡ {pedido.total.toLocaleString()}
                        </strong>

                    </div>

                    {/* ========================= */}
                    {/* OLVIDASTE ALGO */}
                    {/* ========================= */}

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
                                            onClick={
                                                cargarProductos
                                            }
                                        >
                                            ➕ Agregar productos
                                        </button>

                                    )}

                                </div>

                                {/* PRODUCTOS DISPONIBLES */}

                                {mostrarProductos && (

                                    <div className="mt-4">

                                        {/* BUSCADOR */}

                                        <input
                                            className="form-control mb-3"
                                            placeholder="🔍 Buscar producto..."
                                            value={busqueda}
                                            onChange={
                                                e =>
                                                    setBusqueda(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                        {/* PRODUCTOS */}

                                        {productosFiltrados.map(
                                            producto => (

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

                                                            {producto.categoriaExtrasId != null && (

                                                                <small className="text-success">
                                                                    🍔 Permite extras
                                                                </small>

                                                            )}

                                                        </div>

                                                        {/* PRODUCTO NORMAL */}

                                                        {producto.categoriaExtrasId == null ? (

                                                            <div className="d-flex align-items-center gap-2">

                                                                <button
                                                                    type="button"
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
                                                                    {
                                                                        cantidades[
                                                                            producto.id
                                                                        ] || 1
                                                                    }
                                                                </strong>

                                                                <button
                                                                    type="button"
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
                                                                    type="button"
                                                                    className="btn btn-success btn-sm ms-2"
                                                                    disabled={agregando}
                                                                    onClick={() =>
                                                                        agregarProducto(
                                                                            producto
                                                                        )
                                                                    }
                                                                >
                                                                    Agregar
                                                                </button>

                                                            </div>

                                                        ) : (

                                                            /* PRODUCTO CON EXTRAS */

                                                            <button
                                                                type="button"
                                                                className="btn btn-success btn-sm"
                                                                disabled={agregando}
                                                                onClick={() =>
                                                                    agregarProducto(
                                                                        producto
                                                                    )
                                                                }
                                                            >
                                                                🍔 Elegir extras
                                                            </button>

                                                        )}

                                                    </div>

                                                </div>

                                            )
                                        )}

                                        {productosFiltrados.length === 0 && (

                                            <p className="text-center text-muted mt-3">
                                                No se encontraron productos.
                                            </p>

                                        )}

                                        {/* CERRAR */}

                                        <div className="text-center mt-3">

                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() =>
                                                    setMostrarProductos(
                                                        false
                                                    )
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

            {/* ========================= */}
            {/* MODAL EXTRAS */}
            {/* ========================= */}

            {productoSeleccionado && (

                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,.5)"
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">

                            {/* HEADER */}

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title">
                                        {productoSeleccionado.nombre}
                                    </h5>

                                    <small className="text-muted">
                                        Selecciona los extras
                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={
                                        cerrarExtras
                                    }
                                />

                            </div>

                            {/* BODY */}

                            <div className="modal-body">

                                {extrasDisponibles.length === 0 && (

                                    <p className="text-muted">
                                        No hay extras disponibles.
                                    </p>

                                )}

                                {extrasDisponibles.map(
                                    extra => {

                                        const seleccionado =
                                            extrasSeleccionados.some(
                                                e =>
                                                    e.id ===
                                                    extra.id
                                            );

                                        return (

                                            <div
                                                key={extra.id}
                                                className="d-flex justify-content-between align-items-center border-bottom py-3"
                                            >

                                                <div>

                                                    <strong>
                                                        {extra.nombre}
                                                    </strong>

                                                    <div className="text-muted">

                                                        + ₡ {
                                                            extra.precio
                                                                .toLocaleString()
                                                        }

                                                    </div>

                                                </div>

                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={
                                                        seleccionado
                                                    }
                                                    onChange={() =>
                                                        seleccionarExtra(
                                                            extra
                                                        )
                                                    }
                                                />

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                            {/* FOOTER */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={
                                        cerrarExtras
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-success"
                                    disabled={
                                        agregando
                                    }
                                    onClick={
                                        confirmarProductoConExtras
                                    }
                                >
                                    {agregando
                                        ? "Agregando..."
                                        : "Agregar al pedido"}
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default PedidoCliente;