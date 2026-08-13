import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function PedidoXpress() {
    const navigate = useNavigate();

    const [telefono, setTelefono] = useState("");
    const [cliente, setCliente] = useState(null);
    const [nombre, setNombre] = useState("");
    const [direccion, setDireccion] = useState("");
    const [tipoPedido, setTipoPedido] = useState("Xpress");

    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    const [buscandoCliente, setBuscandoCliente] = useState(false);
    const [guardandoCliente, setGuardandoCliente] = useState(false);
    const [guardandoPedido, setGuardandoPedido] = useState(false);

    // =========================
    // Modal extras
    // =========================

    const [productoSeleccionado, setProductoSeleccionado] =
        useState(null);

    const [extrasSeleccionados, setExtrasSeleccionados] =
        useState([]);

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

            alert(
                "No fue posible cargar los productos."
            );
        }
    };

    // =========================
    // Buscar cliente
    // =========================

    const buscarCliente = async () => {

        if (!telefono.trim()) {
            alert(
                "Ingrese un número de teléfono."
            );

            return;
        }

        try {
            setBuscandoCliente(true);

            const respuesta =
                await api.get(
                    `/Clientes/cliente/${telefono}`
                );

            const encontrado =
                respuesta.data;

            setCliente(encontrado);

            setNombre(
                encontrado.nombreCompleto
            );

            setDireccion(
                encontrado.direccion
            );
        }
        catch (error) {

            if (
                error.response?.status === 404
            ) {
                setCliente(null);

                setNombre("");
                setDireccion("");

                alert(
                    "Cliente no encontrado. Complete sus datos para registrarlo."
                );
            }
            else {
                console.error(error);

                alert(
                    "No fue posible buscar el cliente."
                );
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

        // Solo Xpress requiere dirección
        if (
            tipoPedido === "Xpress" &&
            !direccion.trim()
        ) {
            alert("Ingrese la dirección de entrega.");
            return null;
        }

        try {
            setGuardandoCliente(true);

            const respuesta =
                await api.post(
                    "/Clientes/cliente",
                    {
                        telefono,
                        nombreCompleto: nombre,
                        direccion: direccion.trim()
                    }
                );

            const nuevoCliente =
                respuesta.data;

            setCliente(nuevoCliente);

            return nuevoCliente;
        }
        catch (error) {
            console.error(error);

            alert(
                "No fue posible guardar el cliente."
            );

            return null;
        }
        finally {
            setGuardandoCliente(false);
        }
    };

    // =========================
    // Actualizar cliente existente
    // =========================

    const actualizarClienteExistente = async () => {

        if (!cliente)
            return cliente;

        try {
            const clienteActualizado = {
                id: cliente.id,
                telefono,
                nombreCompleto: nombre,
                direccion: direccion.trim(),
                latitud: cliente.latitud ?? null,
                longitud: cliente.longitud ?? null
            };

            await api.put(
                `/Clientes/${cliente.id}`,
                clienteActualizado
            );

            const actualizado = {
                ...cliente,
                ...clienteActualizado
            };

            setCliente(actualizado);

            return actualizado;
        }
        catch (error) {
            console.error(error);

            alert(
                "No fue posible actualizar los datos del cliente."
            );

            return null;
        }
    };

    // =========================
    // Categorías de extras
    // =========================

    /*
     * Buscamos todos los CategoriaExtrasId
     * configurados en productos.
     *
     * Las categorías que aparezcan aquí
     * no se mostrarán como productos normales.
     */
    const categoriasExtrasIds =
        new Set(
            productos
                .map(
                    p =>
                        p.categoriaExtrasId
                )
                .filter(
                    id => id != null
                )
        );

    const productosVisibles =
        productos.filter(
            p =>
                !categoriasExtrasIds.has(
                    p.categoriaId
                )
        );

    // =========================
    // Extras disponibles
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
    // Abrir modal extras
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

    // =========================
    // Seleccionar extra
    // =========================

    const seleccionarExtra = (extra) => {

        setExtrasSeleccionados(
            actual => {

                const existe =
                    actual.some(
                        e =>
                            e.id ===
                            extra.id
                    );

                if (existe) {
                    return actual.filter(
                        e =>
                            e.id !==
                            extra.id
                    );
                }

                return [
                    ...actual,
                    extra
                ];
            }
        );
    };

    // =========================
    // Agregar producto normal
    // =========================

    const agregarProductoNormal =
        (producto) => {

            setCarrito(actual => {

                const existente =
                    actual.find(
                        p =>
                            p.productoId ===
                                producto.id &&
                            !p.esPersonalizado
                    );

                if (existente) {

                    return actual.map(
                        p =>
                            p.productoId ===
                                producto.id &&
                            !p.esPersonalizado
                                ? {
                                    ...p,
                                    cantidad:
                                        p.cantidad + 1
                                }
                                : p
                    );
                }

                return [
                    ...actual,
                    {
                        lineaId:
                            crypto.randomUUID(),

                        productoId:
                            producto.id,

                        nombre:
                            producto.nombre,

                        precio:
                            producto.precio,

                        cantidad: 1,

                        observaciones: "",

                        extras: [],

                        esPersonalizado:
                            false
                    }
                ];
            });
        };

    // =========================
    // Agregar producto
    // =========================

    const agregarProducto =
        (producto) => {

            /*
             * Si permite extras,
             * primero configuramos la unidad.
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
    // Confirmar producto
    // personalizado
    // =========================

    const confirmarProductoConExtras =
        () => {

            if (!productoSeleccionado)
                return;

            const nuevaLinea = {

                lineaId:
                    crypto.randomUUID(),

                productoId:
                    productoSeleccionado.id,

                nombre:
                    productoSeleccionado.nombre,

                precio:
                    productoSeleccionado.precio,

                cantidad: 1,

                observaciones: "",

                esPersonalizado: true,

                extras:
                    extrasSeleccionados.map(
                        extra => ({
                            productoId:
                                extra.id,

                            nombre:
                                extra.nombre,

                            precio:
                                extra.precio,

                            cantidad: 1
                        })
                    )
            };

            setCarrito(
                actual => [
                    ...actual,
                    nuevaLinea
                ]
            );

            cerrarExtras();
        };

    // =========================
    // Cambiar cantidad
    // producto normal
    // =========================

    const cambiarCantidad =
        (lineaId, cantidad) => {

            if (cantidad <= 0) {

                setCarrito(
                    actual =>
                        actual.filter(
                            p =>
                                p.lineaId !==
                                lineaId
                        )
                );

                return;
            }

            setCarrito(
                actual =>
                    actual.map(
                        p =>
                            p.lineaId ===
                            lineaId
                                ? {
                                    ...p,
                                    cantidad
                                }
                                : p
                    )
            );
        };

    // =========================
    // Eliminar personalizado
    // =========================

    const eliminarLinea =
        (lineaId) => {

            setCarrito(
                actual =>
                    actual.filter(
                        p =>
                            p.lineaId !==
                            lineaId
                    )
            );
        };

    // =========================
    // Observaciones
    // =========================

    const cambiarObservaciones =
        (lineaId, observaciones) => {

            setCarrito(
                actual =>
                    actual.map(
                        p =>
                            p.lineaId ===
                            lineaId
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

    const total =
        carrito.reduce(
            (suma, producto) => {

                const totalProducto =
                    producto.precio *
                    producto.cantidad;

                const totalExtras =
                    producto.extras?.reduce(
                        (
                            sumaExtras,
                            extra
                        ) =>
                            sumaExtras +
                            (
                                extra.precio *
                                extra.cantidad
                            ),
                        0
                    ) ?? 0;

                return (
                    suma +
                    totalProducto +
                    totalExtras
                );
            },
            0
        );

    // =========================
    // Crear pedido
    // =========================

    const crearPedido = async () => {

        if (!telefono.trim()) {
            alert(
                "Ingrese el teléfono del cliente."
            );

            return;
        }

        if (!nombre.trim()) {
            alert(
                "Ingrese el nombre del cliente."
            );

            return;
        }

        // Dirección obligatoria únicamente para Xpress
        if (
            tipoPedido === "Xpress" &&
            !direccion.trim()
        ) {
            alert(
                "Ingrese la dirección de entrega."
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

            let clienteActual =
                cliente;

            // =========================
            // CLIENTE NUEVO
            // =========================

            if (!clienteActual) {

                clienteActual =
                    await guardarCliente();

                if (!clienteActual)
                    return;
            }

            // =========================
            // CLIENTE EXISTENTE
            // =========================

            else {

                const cambioNombre =
                    nombre !==
                    clienteActual.nombreCompleto;

                const cambioDireccion =
                    direccion.trim() !==
                    (clienteActual.direccion ?? "").trim();

                if (
                    cambioNombre ||
                    cambioDireccion
                ) {
                    clienteActual =
                        await actualizarClienteExistente();

                    if (!clienteActual)
                        return;
                }
            }

            // =========================
            // PEDIDO
            // =========================

            const dto = {

                tipoPedido,

                mesaId: null,

                clienteId:
                    clienteActual.id,

                productos:
                    carrito.map(
                        p => ({

                            productoId:
                                p.productoId,

                            cantidad:
                                p.cantidad,

                            observaciones:
                                p.observaciones,

                            extras:
                                p.extras?.map(
                                    extra => ({
                                        productoId:
                                            extra.productoId,

                                        cantidad:
                                            extra.cantidad
                                    })
                                ) ?? []
                        })
                    )
            };

            console.log(
                tipoPedido === "Llevar"
                    ? "Pedido para llevar:"
                    : "Pedido Xpress:"
            );

            console.log(
                JSON.stringify(
                    dto,
                    null,
                    2
                )
            );

            const respuesta =
                await api.post(
                    "/Pedidos",
                    dto
                );

            alert(
                `Pedido #${respuesta.data.numeroPedido} creado correctamente.`
            );

            // =========================
            // LIMPIAR FORMULARIO
            // =========================

            setTelefono("");
            setCliente(null);
            setNombre("");
            setDireccion("");
            setTipoPedido("Xpress");
            setCarrito([]);

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
        productosVisibles.filter(
            p => {

                const texto =
                    busqueda
                        .toLowerCase()
                        .trim();

                return (
                    p.nombre
                        ?.toLowerCase()
                        .includes(texto) ||

                    p.categoria
                        ?.toLowerCase()
                        .includes(texto)
                );
            }
        );

    return (

        <div className="container py-4">

            {/* HEADER */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="mb-1">
                        📞 Pedido telefónico
                    </h2>

                    <p className="text-muted mb-0">
                        Crear un pedido para entrega o para llevar.
                    </p>

                </div>

                <button
                    className="btn btn-outline-secondary"
                    onClick={() =>
                        navigate("/pedidos")
                    }
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
                                    onChange={
                                        e =>
                                            setTelefono(
                                                e.target.value
                                            )
                                    }
                                />

                                <button
                                    className="btn btn-success"
                                    onClick={
                                        buscarCliente
                                    }
                                    disabled={
                                        buscandoCliente
                                    }
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

                                    {
                                        cliente.nombreCompleto
                                    }

                                    <br />

                                    <small>
                                        📍 {
                                            cliente.direccion
                                        }
                                    </small>

                                </div>

                            )}

                            {!cliente &&
                                telefono && (

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
                                onChange={
                                    e =>
                                        setNombre(
                                            e.target.value
                                        )
                                }
                                placeholder="Nombre del cliente"
                            />

                        </div>

                        <div className="col-12">

                            <label className="form-label fw-semibold">
                                ¿Cómo recibe el pedido?
                            </label>

                            <div className="row g-2">

                                <div className="col-md-6">

                                    <button
                                        type="button"
                                        className={
                                            tipoPedido === "Xpress"
                                                ? "btn btn-success w-100 p-3"
                                                : "btn btn-outline-success w-100 p-3"
                                        }
                                        onClick={() =>
                                            setTipoPedido("Xpress")
                                        }
                                    >
                                        <div className="fs-5">
                                            🛵 Envío Xpress
                                        </div>

                                        <small>
                                            Se entrega al cliente
                                        </small>
                                    </button>

                                </div>

                                <div className="col-md-6">

                                    <button
                                        type="button"
                                        className={
                                            tipoPedido === "Llevar"
                                                ? "btn btn-warning w-100 p-3"
                                                : "btn btn-outline-warning w-100 p-3"
                                        }
                                        onClick={() =>
                                            setTipoPedido("Llevar")
                                        }
                                    >
                                        <div className="fs-5">
                                            🥡 Pasa a llevar
                                        </div>

                                        <small>
                                            El cliente viene a recoger
                                        </small>
                                    </button>

                                </div>

                            </div>

                        </div>

                        {tipoPedido === "Xpress" ? (

                            <div className="col-12">

                                <label className="form-label">
                                    Dirección de entrega
                                    <span className="text-danger ms-1">
                                        *
                                    </span>
                                </label>

                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={direccion}
                                    onChange={
                                        e =>
                                            setDireccion(
                                                e.target.value
                                            )
                                    }
                                    placeholder="Dirección de entrega"
                                />

                            </div>

                        ) : (

                            <div className="col-12">

                                <div className="alert alert-warning mb-0">

                                    <div className="fw-bold fs-5">
                                        🥡 Pasa a llevar
                                    </div>

                                    <div>
                                        El cliente pasará al restaurante
                                        a recoger el pedido.
                                    </div>

                                    {direccion && (

                                        <small className="d-block mt-2 text-muted">
                                            La dirección guardada del cliente se conserva
                                            para futuros pedidos Xpress.
                                        </small>

                                    )}

                                </div>

                            </div>

                        )}

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
                                    {
                                        productosVisibles.length
                                    }
                                </span>

                            </div>

                        </div>

                        <div className="card-body">

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

                            <div className="row g-2">

                                {productosFiltrados.map(
                                    producto => (

                                        <div
                                            className="col-md-6"
                                            key={producto.id}
                                        >

                                            <button
                                                type="button"
                                                className="btn btn-outline-success w-100 text-start p-3 h-100"
                                                onClick={() =>
                                                    agregarProducto(
                                                        producto
                                                    )
                                                }
                                            >

                                                <strong>
                                                    {
                                                        producto.nombre
                                                    }
                                                </strong>

                                                <br />

                                                <span className="text-success">
                                                    ₡ {
                                                        producto.precio.toLocaleString()
                                                    }
                                                </span>

                                                {producto.categoria && (

                                                    <small className="d-block text-muted">
                                                        {
                                                            producto.categoria
                                                        }
                                                    </small>

                                                )}

                                                {producto.categoriaExtrasId != null && (

                                                    <small className="d-block text-success fw-semibold mt-1">
                                                        🍔 Permite extras
                                                    </small>

                                                )}

                                            </button>

                                        </div>

                                    )
                                )}

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

                                    <div
                                        style={{
                                            fontSize: "3rem"
                                        }}
                                    >
                                        🛒
                                    </div>

                                    <p className="mb-0">
                                        Agregue productos al pedido.
                                    </p>

                                </div>

                            ) : (

                                carrito.map(producto => {

                                    const totalExtras =
                                        producto.extras?.reduce(
                                            (
                                                suma,
                                                extra
                                            ) =>
                                                suma +
                                                extra.precio *
                                                extra.cantidad,
                                            0
                                        ) ?? 0;

                                    const subtotal =
                                        producto.precio *
                                        producto.cantidad +
                                        totalExtras;

                                    return (

                                        <div
                                            key={
                                                producto.lineaId
                                            }
                                            className="border-bottom pb-3 mb-3"
                                        >

                                            <div className="d-flex justify-content-between">

                                                <strong>
                                                    {
                                                        producto.nombre
                                                    }
                                                </strong>

                                                <span className="text-success fw-bold">
                                                    ₡ {
                                                        subtotal.toLocaleString()
                                                    }
                                                </span>

                                            </div>

                                            {/* EXTRAS */}

                                            {producto.extras?.length > 0 && (

                                                <div className="ms-3 mt-2">

                                                    {producto.extras.map(
                                                        extra => (

                                                            <div
                                                                key={
                                                                    extra.productoId
                                                                }
                                                                className="small text-success"
                                                            >
                                                                ➕ {
                                                                    extra.nombre
                                                                }

                                                                <span className="ms-2">
                                                                    ₡ {
                                                                        extra.precio.toLocaleString()
                                                                    }
                                                                </span>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            )}

{/* CANTIDAD Y ELIMINAR */}

{!producto.esPersonalizado ? (

    <div className="d-flex align-items-center justify-content-between mt-2">

        <div className="d-flex align-items-center">

            <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() =>
                    cambiarCantidad(
                        producto.lineaId,
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
                type="button"
                className="btn btn-outline-success btn-sm"
                onClick={() =>
                    cambiarCantidad(
                        producto.lineaId,
                        producto.cantidad + 1
                    )
                }
            >
                +
            </button>

        </div>

        <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() =>
                eliminarLinea(
                    producto.lineaId
                )
            }
        >
            🗑️ Eliminar
        </button>

    </div>

) : (

    <div className="d-flex align-items-center justify-content-between mt-2">

        <span className="badge bg-secondary">
            x1
        </span>

        <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() =>
                eliminarLinea(
                    producto.lineaId
                )
            }
        >
            🗑️ Eliminar
        </button>

    </div>

)}

                                            <input
                                                className="form-control form-control-sm mt-2"
                                                placeholder="Observaciones..."
                                                value={
                                                    producto.observaciones
                                                }
                                                onChange={
                                                    e =>
                                                        cambiarObservaciones(
                                                            producto.lineaId,
                                                            e.target.value
                                                        )
                                                }
                                            />

                                        </div>

                                    );
                                })

                            )}

                            <div className="d-flex justify-content-between border-top pt-3">

                                <strong>
                                    Total
                                </strong>

                                <strong className="text-success fs-4">
                                    ₡ {
                                        total.toLocaleString()
                                    }
                                </strong>

                            </div>

                            <button
                                className={
                                    tipoPedido === "Llevar"
                                        ? "btn btn-warning btn-lg w-100 mt-3"
                                        : "btn btn-success btn-lg w-100 mt-3"
                                }
                                onClick={
                                    crearPedido
                                }
                                disabled={
                                    guardandoPedido ||
                                    carrito.length === 0
                                }
                            >
                                {guardandoPedido
                                    ? "Creando pedido..."
                                    : tipoPedido === "Llevar"
                                        ? "🥡 Crear Pedido para Llevar"
                                        : "🛵 Crear Pedido Xpress"}
                            </button>

                        </div>

                    </div>

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

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title">
                                        {
                                            productoSeleccionado.nombre
                                        }
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
                                                key={
                                                    extra.id
                                                }
                                                className="d-flex justify-content-between align-items-center border-bottom py-3"
                                            >

                                                <div>

                                                    <strong>
                                                        {
                                                            extra.nombre
                                                        }
                                                    </strong>

                                                    <div className="text-muted">
                                                        + ₡ {
                                                            extra.precio.toLocaleString()
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

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={
                                        cerrarExtras
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    className="btn btn-success"
                                    onClick={
                                        confirmarProductoConExtras
                                    }
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

export default PedidoXpress;