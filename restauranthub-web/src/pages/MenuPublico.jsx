import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function MenuPublico() {
    const { codigoQr } = useParams();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState(null);
    const [mesa, setMesa] = useState(null);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [categoriaSeleccionada, setCategoriaSeleccionada] =
        useState("Todos");
		
		const [busqueda, setBusqueda] = useState("");

    // Modal de extras
    const [productoSeleccionado, setProductoSeleccionado] =
        useState(null);

    const [extrasSeleccionados, setExtrasSeleccionados] =
        useState([]);

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
                    observaciones: "",

                    // Cada posición representa una unidad
                    // individual del producto.
                    unidades: []
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

    /*
     * Categorías utilizadas como categorías de extras.
     *
     * No queremos que aparezcan como categorías normales
     * del menú.
     */
    const categoriasExtrasIds = new Set(
        productos
            .map(p => p.categoriaExtrasId)
            .filter(id => id != null)
    );

    /*
     * Oculta del menú los productos que son extras.
     */
    const productosMenu = productos.filter(
        p => !categoriasExtrasIds.has(p.categoriaId)
    );

    const categorias = [
        "Todos",
        ...new Set(
            productosMenu
                .map(p => p.categoriaNombre)
                .filter(c => c && c.trim() !== "")
        )
    ];

const productosFiltrados = productosMenu.filter(p => {

    const texto =
        busqueda
            .toLowerCase()
            .trim();

    // =========================
    // BUSCADOR
    // =========================

    if (texto !== "") {

        return (
            p.nombre
                ?.toLowerCase()
                .includes(texto) ||

            p.descripcion
                ?.toLowerCase()
                .includes(texto) ||

            p.categoriaNombre
                ?.toLowerCase()
                .includes(texto)
        );
    }

    // =========================
    // CATEGORÍAS
    // =========================

    if (categoriaSeleccionada === "Todos")
        return true;

    return (
        p.categoriaNombre ===
        categoriaSeleccionada
    );
});

    /*
     * Extras disponibles para la hamburguesa
     * seleccionada.
     */
    const extrasDisponibles = productoSeleccionado
        ? productos.filter(
            p =>
                p.categoriaId ===
                productoSeleccionado.categoriaExtrasId
        )
        : [];

    const abrirExtras = (producto) => {
        setProductoSeleccionado(producto);
        setExtrasSeleccionados([]);
    };

    const cerrarExtras = () => {
        setProductoSeleccionado(null);
        setExtrasSeleccionados([]);
    };

    const seleccionarExtra = (extra) => {
        setExtrasSeleccionados(prev => {
            const existe =
                prev.some(e => e.id === extra.id);

            if (existe) {
                return prev.filter(
                    e => e.id !== extra.id
                );
            }

            return [...prev, extra];
        });
    };

    /*
     * Para productos SIN extras.
     */
    const cambiarCantidadNormal = (id, valor) => {
        setProductos(prev =>
            prev.map(p => {
                if (p.id !== id)
                    return p;

                return {
                    ...p,
                    cantidad: Math.max(
                        0,
                        p.cantidad + valor
                    )
                };
            })
        );
    };

    /*
     * Botón +
     *
     * Si tiene CategoriaExtrasId abre modal.
     * Si no, aumenta normalmente.
     */
    const agregarProducto = (producto) => {
        if (producto.categoriaExtrasId != null) {
            abrirExtras(producto);
            return;
        }

        cambiarCantidadNormal(
            producto.id,
            1
        );
    };

    /*
     * Confirma UNA nueva hamburguesa
     * con los extras seleccionados.
     */
    const confirmarProductoConExtras = () => {
        if (!productoSeleccionado)
            return;

        setProductos(prev =>
            prev.map(p => {
                if (
                    p.id !== productoSeleccionado.id
                ) {
                    return p;
                }

const nuevaUnidad = {
    extras:
        extrasSeleccionados.map(extra => ({
            id: extra.id,
            productoId: extra.id,
            nombre: extra.nombre,
            precio: Number(extra.precio ?? 0)
        }))
};

                return {
                    ...p,

                    cantidad: p.cantidad + 1,

                    unidades: [
                        ...p.unidades,
                        nuevaUnidad
                    ]
                };
            })
        );

        cerrarExtras();
    };

    /*
     * Botón -
     *
     * Si el producto tiene extras,
     * elimina la última unidad agregada
     * junto con sus extras.
     */
    const quitarProducto = (producto) => {
        if (producto.cantidad <= 0)
            return;

        if (producto.categoriaExtrasId != null) {

            setProductos(prev =>
                prev.map(p => {

                    if (p.id !== producto.id)
                        return p;

                    return {
                        ...p,

                        cantidad:
                            Math.max(
                                0,
                                p.cantidad - 1
                            ),

                        unidades:
                            p.unidades.slice(0, -1)
                    };
                })
            );

            return;
        }

        cambiarCantidadNormal(
            producto.id,
            -1
        );
    };

    const actualizarObservacion = (
        id,
        texto
    ) => {
        setProductos(prev =>
            prev.map(p => {

                if (p.id !== id)
                    return p;

                return {
                    ...p,
                    observaciones: texto
                };
            })
        );
    };

    /*
     * Total de extras.
     */
const calcularExtrasProducto = (producto) => {

    if (!producto.unidades)
        return 0;

    return producto.unidades.reduce(
        (totalUnidades, unidad) => {

            const totalExtras =
                (unidad.extras ?? []).reduce(
                    (total, extra) =>
                        total + Number(extra.precio ?? 0),
                    0
                );

            return totalUnidades + totalExtras;
        },
        0
    );
};

const total = productos.reduce(
    (suma, p) => {

        const precio =
            Number(p.precio ?? 0);

        const cantidad =
            Number(p.cantidad ?? 0);

        const totalProducto =
            precio * cantidad;

        const totalExtras =
            calcularExtrasProducto(p);

        return (
            Number(suma) +
            totalProducto +
            totalExtras
        );
    },
    0
);

    const articulos = productos.reduce(
        (suma, p) =>
            suma + p.cantidad,
        0
    );

    const enviarPedido = async () => {

        /*
         * Primero armamos cada unidad
         * personalizada por separado.
         */
        const productosPedido = [];

        productos.forEach(p => {

            if (p.cantidad <= 0)
                return;

            /*
             * Producto configurable.
             */
            if (
                p.categoriaExtrasId != null
            ) {

                p.unidades.forEach(unidad => {

                    productosPedido.push({
                        productoId: p.id,
                        cantidad: 1,
                        observaciones:
                            p.observaciones,

                        extras:
                            unidad.extras.map(extra => ({
                                productoId:
                                    extra.productoId,
                                cantidad: 1
                            }))
                    });

                });

                return;
            }

            /*
             * Producto normal.
             */
            productosPedido.push({
                productoId: p.id,
                cantidad: p.cantidad,
                observaciones:
                    p.observaciones,
                extras: []
            });
        });

        if (
            productosPedido.length === 0
        ) {
            alert(
                "Seleccione al menos un producto."
            );
            return;
        }

const pedido = {
    tipoPedido: "Mesa",
    mesaId: mesa.id,
    clienteId: null,
    productos: productosPedido
};

        console.log(
            "Pedido enviado:"
        );

        console.log(
            JSON.stringify(
                pedido,
                null,
                2
            )
        );

        try {
            const respuesta =
                await api.post(
                    "/Pedidos",
                    pedido
                );

            navigate(
                `/pedido/${respuesta.data.pedidoQR}`
            );
        }
        catch (error) {

            console.error(error);
            console.log(error.response);

            alert(
                "No fue posible enviar el pedido."
            );
        }
    };

    if (loading) {
        return (
            <h3 className="text-center mt-5">
                Cargando...
            </h3>
        );
    }

    return (
        <div className="container py-4">

            <div className="text-center mb-4">

                <h2>
                    {restaurant.name}
                </h2>

                <h5>
                    Mesa #{mesa.number}
                </h5>
				<div className="mt-4 mb-3 mx-auto"
    style={{
        maxWidth: "600px"
    }}
>

    <div className="input-group input-group-lg">

        <span className="input-group-text">
            🔎
        </span>

        <input
            type="text"
            className="form-control"
            placeholder="Buscar hamburguesa, bebida, pizza..."
            value={busqueda}
            onChange={(e) =>
                setBusqueda(
                    e.target.value
                )
            }
        />

        {busqueda && (

            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                    setBusqueda("")
                }
            >
                ✕
            </button>

        )}

    </div>

    {busqueda && (

        <div className="small text-muted mt-2">
            Mostrando resultados para
            {" "}
            <strong>
                "{busqueda}"
            </strong>
        </div>

    )}

</div>

                <div className="d-flex flex-wrap gap-2 justify-content-center mt-4 mb-4">

                    {categorias.map(
                        categoria => (

                            <button
                                key={categoria}
                                className={
                                    categoriaSeleccionada ===
                                    categoria
                                        ? "btn btn-success"
                                        : "btn btn-outline-success"
                                }
                                onClick={() =>
                                    setCategoriaSeleccionada(
                                        categoria
                                    )
                                }
                            >
                                {categoria}
                            </button>

                        )
                    )}

                </div>

            </div>

            <div className="row">

                {productosFiltrados.map(
                    producto => (

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
                                        ₡ {producto.precio.toLocaleString()}
                                    </h5>

                                    {producto.categoriaExtrasId != null && (
                                        <small className="text-success fw-semibold">
                                            🍔 Permite extras
                                        </small>
                                    )}

                                    <textarea
                                        className="form-control mt-3"
                                        rows="2"
                                        placeholder="Ej. Sin cebolla..."
                                        value={
                                            producto.observaciones
                                        }
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
                                                quitarProducto(
                                                    producto
                                                )
                                            }
                                        >
                                            -
                                        </button>

                                        <h4 className="mx-4">
                                            {
                                                producto.cantidad
                                            }
                                        </h4>

                                        <button
                                            className="btn btn-success"
                                            onClick={() =>
                                                agregarProducto(
                                                    producto
                                                )
                                            }
                                        >
                                            +
                                        </button>

                                    </div>

                                    {/* Resumen discreto de extras */}

                                    {producto.unidades?.map(
                                        (unidad, index) => {

                                            if (
                                                unidad.extras.length ===
                                                0
                                            ) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    key={index}
                                                    className="small text-muted mt-2"
                                                >
                                                    <strong>
                                                        #{index + 1}
                                                    </strong>

                                                    {" + "}

                                                    {
                                                        unidad.extras
                                                            .map(
                                                                extra =>
                                                                    extra.nombre
                                                            )
                                                            .join(
                                                                ", "
                                                            )
                                                    }
                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </div>

                        </div>

                    )
                )}
{productosFiltrados.length === 0 && (

    <div className="col-12">

        <div className="text-center py-5 text-muted">

            <div
                style={{
                    fontSize: "3rem"
                }}
            >
                🔍
            </div>

            <h5 className="mt-2">
                No encontramos ese producto
            </h5>

            <p>
                Intenta buscar con otro nombre.
            </p>

            <button
                type="button"
                className="btn btn-outline-success"
                onClick={() =>
                    setBusqueda("")
                }
            >
                Ver todo el menú
            </button>

        </div>

    </div>

)}
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
                        ₡ {Number(total).toLocaleString()}
                    </strong>

                </div>

                <button
                    className="btn btn-success w-100 mt-3"
                    onClick={enviarPedido}
                >
                    🛒 Enviar Pedido
                </button>

            </div>

{/* MODAL EXTRAS */}

{productoSeleccionado && (

    <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        style={{
            backgroundColor: "rgba(0,0,0,.5)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)"
        }}
    >

        <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            style={{
                margin: "1rem auto",
                minHeight: "calc(100% - 2rem)",
                maxWidth: "500px"
            }}
        >

            <div
                className="modal-content"
                style={{
                    maxHeight: "calc(100dvh - 2rem)",
                    overflow: "hidden"
                }}
            >

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
                        onClick={cerrarExtras}
                        aria-label="Cerrar"
                    />

                </div>

                {/* BODY */}

                <div
                    className="modal-body"
                    style={{
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch"
                    }}
                >

                    {extrasDisponibles.length === 0 && (

                        <div className="text-muted text-center py-3">
                            No hay extras disponibles.
                        </div>

                    )}

                    {extrasDisponibles.map(extra => {

                        const seleccionado =
                            extrasSeleccionados.some(
                                e => e.id === extra.id
                            );

                        return (

                            <label
                                key={extra.id}
                                className="d-flex justify-content-between align-items-center border-bottom py-3"
                                style={{
                                    cursor: "pointer",
                                    minHeight: "60px"
                                }}
                            >

                                <div>

                                    <strong>
                                        {extra.nombre}
                                    </strong>

                                    <div className="text-muted">
                                        + ₡ {extra.precio.toLocaleString()}
                                    </div>

                                </div>

                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={seleccionado}
                                    onChange={() =>
                                        seleccionarExtra(extra)
                                    }
                                    style={{
                                        width: "1.4rem",
                                        height: "1.4rem",
                                        flexShrink: 0
                                    }}
                                />

                            </label>

                        );

                    })}

                </div>

                {/* FOOTER */}

                <div
                    className="modal-footer bg-white"
                    style={{
                        flexShrink: 0,
                        paddingBottom:
                            "max(0.75rem, env(safe-area-inset-bottom))"
                    }}
                >

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={cerrarExtras}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={confirmarProductoConExtras}
                    >
                        Agregar
                    </button>

                </div>

            </div>

        </div>

    </div>

)}

        </div>
    );
}

export default MenuPublico;