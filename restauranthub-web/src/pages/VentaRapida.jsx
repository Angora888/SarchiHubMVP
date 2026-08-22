import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function VentaRapida() {

    const navigate = useNavigate();

    const {
        toast,
        showToast,
        hideToast
    } = useToast();

    // ==========================================
    // PRODUCTOS
    // ==========================================

    const [productos, setProductos] =
        useState([]);

    const [busqueda, setBusqueda] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    // ==========================================
    // CARRITO
    // ==========================================

    const [carrito, setCarrito] =
        useState([]);

    const menuRef =
        useRef(null);

    const carritoRef =
        useRef(null);

    const [
        carritoVisible,
        setCarritoVisible
    ] = useState(false);

    const [
        menuVisible,
        setMenuVisible
    ] = useState(true);

    // ==========================================
    // EXTRAS
    // ==========================================

    const [
        productoSeleccionado,
        setProductoSeleccionado
    ] = useState(null);

    const [
        extrasSeleccionados,
        setExtrasSeleccionados
    ] = useState([]);

    // ==========================================
    // ENVÍO
    // ==========================================

    const [enviando, setEnviando] =
        useState(false);

    const enviandoRef =
        useRef(false);

    // ==========================================
    // CARGAR PRODUCTOS
    // ==========================================

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {

        try {

            setLoading(true);

            const respuesta =
                await api.get(
                    "/Productos/productos-xpress"
                );

            setProductos(
                respuesta.data
            );

        }
        catch (error) {

            console.error(error);

            showToast(
                error.response?.data ||
                "No fue posible cargar los productos.",
                "error"
            );

        }
        finally {

            setLoading(false);
        }
    };

    // ==========================================
    // OBSERVAR MENÚ Y CARRITO
    // ==========================================

    useEffect(() => {

        const menu =
            menuRef.current;

        const carritoElemento =
            carritoRef.current;

        const observerMenu =
            new IntersectionObserver(
                entries => {
                    setMenuVisible(
                        entries[0].isIntersecting
                    );
                },
                {
                    threshold: 0.15
                }
            );

        const observerCarrito =
            new IntersectionObserver(
                entries => {
                    setCarritoVisible(
                        entries[0].isIntersecting
                    );
                },
                {
                    threshold: 0.2
                }
            );

        if (menu) {
            observerMenu.observe(menu);
        }

        if (carritoElemento) {
            observerCarrito.observe(
                carritoElemento
            );
        }

        return () => {

            observerMenu.disconnect();
            observerCarrito.disconnect();

        };

    }, [
        loading,
        carrito.length
    ]);

    // ==========================================
    // IR AL CARRITO
    // ==========================================

    const irAlCarrito = () => {

        carritoRef.current
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    };

    // ==========================================
    // IR AL MENÚ
    // ==========================================

    const irAlMenu = () => {

        menuRef.current
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    };

    // ==========================================
    // IDENTIFICAR CATEGORÍAS DE EXTRAS
    // ==========================================

    const categoriasExtrasIds =
        useMemo(() => {

            return new Set(
                productos
                    .map(
                        producto =>
                            producto.categoriaExtrasId
                    )
                    .filter(
                        id =>
                            id != null
                    )
            );

        }, [productos]);

    /*
     * Los productos que pertenecen a una
     * categoría usada como extras no deben
     * aparecer como productos normales.
     */
    const productosVisibles =
        useMemo(() => {

            return productos.filter(
                producto =>
                    !categoriasExtrasIds.has(
                        producto.categoriaId
                    )
            );

        }, [
            productos,
            categoriasExtrasIds
        ]);

    // ==========================================
    // FILTRAR PRODUCTOS
    // ==========================================

    const productosFiltrados =
        useMemo(() => {

            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            if (!texto) {
                return productosVisibles;
            }

            return productosVisibles.filter(
                producto => {

                    const nombre =
                        producto.nombre
                            ?.toLowerCase() ?? "";

                    const descripcion =
                        producto.descripcion
                            ?.toLowerCase() ?? "";

                    const categoria =
                        producto.categoria
                            ?.toLowerCase() ?? "";

                    return (
                        nombre.includes(texto) ||
                        descripcion.includes(texto) ||
                        categoria.includes(texto)
                    );
                }
            );

        }, [
            productosVisibles,
            busqueda
        ]);

    // ==========================================
    // EXTRAS DISPONIBLES
    // ==========================================

    const extrasDisponibles =
        productoSeleccionado
            ? productos.filter(
                producto =>
                    producto.categoriaId ===
                    productoSeleccionado
                        .categoriaExtrasId
            )
            : [];

    // ==========================================
    // ABRIR EXTRAS
    // ==========================================

    const abrirExtras = (
        producto
    ) => {

        setProductoSeleccionado(
            producto
        );

        setExtrasSeleccionados(
            []
        );
    };

    // ==========================================
    // CERRAR EXTRAS
    // ==========================================

    const cerrarExtras = () => {

        setProductoSeleccionado(
            null
        );

        setExtrasSeleccionados(
            []
        );
    };

    // ==========================================
    // SELECCIONAR EXTRA
    // ==========================================

    const seleccionarExtra = (
        extra
    ) => {

        setExtrasSeleccionados(
            actual => {

                const existe =
                    actual.some(
                        item =>
                            item.id ===
                            extra.id
                    );

                if (existe) {

                    return actual.filter(
                        item =>
                            item.id !==
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

    // ==========================================
    // AGREGAR PRODUCTO NORMAL
    // ==========================================

    const agregarProductoNormal = (
        producto
    ) => {

        setCarrito(
            actual => {

                const existente =
                    actual.find(
                        item =>
                            item.productoId ===
                                producto.id &&
                            !item.esPersonalizado
                    );

                if (existente) {

                    return actual.map(
                        item =>
                            item.productoId ===
                                producto.id &&
                            !item.esPersonalizado

                                ? {
                                    ...item,

                                    cantidad:
                                        item.cantidad + 1
                                }

                                : item
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
                            Number(
                                producto.precio
                            ),

                        cantidad:
                            1,

                        observaciones:
                            "",

                        extras:
                            [],

                        esPersonalizado:
                            false
                    }
                ];
            }
        );
    };

    // ==========================================
    // AGREGAR PRODUCTO
    // ==========================================

    const agregarProducto = (
        producto
    ) => {

        /*
         * Si tiene categoría de extras,
         * primero mostramos el modal.
         */
        if (
            producto.categoriaExtrasId != null
        ) {

            abrirExtras(
                producto
            );

            return;
        }

        agregarProductoNormal(
            producto
        );
    };

    // ==========================================
    // CONFIRMAR PRODUCTO CON EXTRAS
    // ==========================================

    const confirmarProductoConExtras =
        () => {

            if (!productoSeleccionado) {
                return;
            }

            /*
             * Cada combinación personalizada
             * es una línea independiente.
             *
             * Ejemplo:
             *
             * Golden + huevo
             * Golden + jalapeños
             *
             * no deben mezclarse.
             */

            const nuevaLinea = {

                lineaId:
                    crypto.randomUUID(),

                productoId:
                    productoSeleccionado.id,

                nombre:
                    productoSeleccionado.nombre,

                precio:
                    Number(
                        productoSeleccionado.precio
                    ),

                cantidad:
                    1,

                observaciones:
                    "",

                esPersonalizado:
                    true,

                extras:
                    extrasSeleccionados.map(
                        extra => ({

                            productoId:
                                extra.id,

                            nombre:
                                extra.nombre,

                            precio:
                                Number(
                                    extra.precio
                                ),

                            cantidad:
                                1
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

    // ==========================================
    // CANTIDAD
    // ==========================================

    const cambiarCantidad = (
        lineaId,
        cantidad
    ) => {

        if (cantidad <= 0) {

            setCarrito(
                actual =>
                    actual.filter(
                        item =>
                            item.lineaId !==
                            lineaId
                    )
            );

            return;
        }

        setCarrito(
            actual =>
                actual.map(
                    item =>
                        item.lineaId ===
                            lineaId

                            ? {
                                ...item,
                                cantidad
                            }

                            : item
                )
        );
    };

    // ==========================================
    // ELIMINAR LÍNEA
    // ==========================================

    const eliminarLinea = (
        lineaId
    ) => {

        setCarrito(
            actual =>
                actual.filter(
                    item =>
                        item.lineaId !==
                        lineaId
                )
        );
    };

    // ==========================================
    // OBSERVACIONES
    // ==========================================

    const cambiarObservaciones = (
        lineaId,
        observaciones
    ) => {

        setCarrito(
            actual =>
                actual.map(
                    item =>
                        item.lineaId ===
                            lineaId

                            ? {
                                ...item,
                                observaciones
                            }

                            : item
                )
        );
    };

    // ==========================================
    // TOTAL
    // ==========================================

    const total =
        carrito.reduce(
            (
                suma,
                producto
            ) => {

                const subtotalProducto =
                    Number(
                        producto.precio ?? 0
                    ) *
                    Number(
                        producto.cantidad ?? 0
                    );

                const subtotalExtras =
                    producto.extras
                        ?.reduce(
                            (
                                sumaExtras,
                                extra
                            ) =>
                                sumaExtras +
                                (
                                    Number(
                                        extra.precio ?? 0
                                    ) *
                                    Number(
                                        extra.cantidad ?? 0
                                    )
                                ),

                            0
                        ) ?? 0;

                return (
                    suma +
                    subtotalProducto +
                    subtotalExtras
                );

            },
            0
        );

    // ==========================================
    // CANTIDAD ARTÍCULOS
    // ==========================================

    const cantidadArticulos =
        carrito.reduce(
            (
                suma,
                item
            ) =>
                suma +
                item.cantidad,

            0
        );

    // ==========================================
    // REGISTRAR VENTA
    // ==========================================

    const registrarVenta = async () => {

        if (
            enviandoRef.current
        ) {
            return;
        }

        if (
            carrito.length === 0
        ) {

            showToast(
                "Agregue al menos un producto.",
                "warning"
            );

            return;
        }

        try {

            enviandoRef.current =
                true;

            setEnviando(
                true
            );

            const dto = {

                productos:
                    carrito.map(
                        producto => ({

                            productoId:
                                producto.productoId,

                            cantidad:
                                producto.cantidad,

                            observaciones:
                                producto.observaciones,

                            extras:
                                producto.extras
                                    ?.map(
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

            const respuesta =
                await api.post(
                    "/Pedidos/venta-rapida",
                    dto
                );

            showToast(
                `Venta #${respuesta.data.numeroPedido} registrada correctamente.`,
                "success"
            );

            setCarrito([]);

            setBusqueda("");

            /*
             * Volvemos automáticamente
             * al menú para registrar la
             * siguiente venta.
             */
            setTimeout(
                () => {
                    irAlMenu();
                },
                150
            );

        }
        catch (error) {

            console.error(error);

            showToast(
                error.response?.data ||
                "No fue posible registrar la venta.",
                "error"
            );

        }
        finally {

            setEnviando(
                false
            );

            enviandoRef.current =
                false;
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="container py-5 text-center">

                <div className="spinner-border text-success"></div>

                <p className="mt-3">
                    Cargando productos...
                </p>

            </div>
        );
    }

    return (

        <div className="container py-4">

            {/* ====================================== */}
            {/* HEADER */}
            {/* ====================================== */}

            <div
                ref={menuRef}
                className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4"
            >

                <div>

                    <h2 className="fw-bold mb-1">
                        ⚡ Venta rápida
                    </h2>

                    <p className="text-muted mb-0">
                        Registra una venta ya realizada.
                    </p>

                </div>

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

            <div className="row g-4">

                {/* ====================================== */}
                {/* MENÚ */}
                {/* ====================================== */}

                <div className="col-lg-7">

                    <div className="card shadow-sm border-0 rounded-4">

                        <div className="card-body">

                            <input
                                type="text"
                                className="form-control form-control-lg mb-4"
                                placeholder="🔍 Buscar producto..."
                                value={busqueda}
                                onChange={
                                    e =>
                                        setBusqueda(
                                            e.target.value
                                        )
                                }
                            />

                            <div className="row g-3">

                                {productosFiltrados.map(
                                    producto => (

                                        <div
                                            className="col-12 col-md-6"
                                            key={producto.id}
                                        >

                                            <div className="card border h-100 rounded-4">

                                                <div className="card-body">

                                                    <h5 className="fw-bold">
                                                        {producto.nombre}
                                                    </h5>

                                                    {producto.descripcion && (

                                                        <p className="text-muted small">
                                                            {
                                                                producto.descripcion
                                                            }
                                                        </p>

                                                    )}

                                                    <h5 className="text-success fw-bold">

                                                        ₡{" "}
                                                        {Number(
                                                            producto.precio
                                                        ).toLocaleString(
                                                            "es-CR"
                                                        )}

                                                    </h5>

                                                    <button
                                                        type="button"
                                                        className="btn btn-success w-100 mt-2"
                                                        onClick={() =>
                                                            agregarProducto(
                                                                producto
                                                            )
                                                        }
                                                    >

                                                        {
                                                            producto
                                                                .categoriaExtrasId !=
                                                            null

                                                                ? "🍔 Elegir extras"

                                                                : "➕ Agregar"
                                                        }

                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </div>

                {/* ====================================== */}
                {/* CARRITO */}
                {/* ====================================== */}

                <div
                    ref={carritoRef}
                    className="col-lg-5"
                >

                    <div
                        className="card shadow border-0 rounded-4"
                        style={{
                            position: "sticky",
                            top: "20px"
                        }}
                    >

                        <div className="card-header bg-dark text-white">

                            <h5 className="mb-0">

                                🧾 Venta

                                {cantidadArticulos > 0 && (

                                    <span className="badge bg-success ms-2">
                                        {cantidadArticulos}
                                    </span>

                                )}

                            </h5>

                        </div>

                        <div className="card-body">

                            {carrito.length === 0 ? (

                                <div className="text-center text-muted py-5">

                                    <div
                                        style={{
                                            fontSize: "2.5rem"
                                        }}
                                    >
                                        🛒
                                    </div>

                                    <p className="mb-0 mt-2">
                                        Agregue productos
                                    </p>

                                </div>

                            ) : (

                                carrito.map(
                                    producto => {

                                        const subtotalExtras =
                                            producto.extras
                                                ?.reduce(
                                                    (
                                                        suma,
                                                        extra
                                                    ) =>
                                                        suma +
                                                        (
                                                            extra.precio *
                                                            extra.cantidad
                                                        ),
                                                    0
                                                ) ?? 0;

                                        const subtotal =
                                            (
                                                producto.precio *
                                                producto.cantidad
                                            ) +
                                            subtotalExtras;

                                        return (

                                            <div
                                                key={
                                                    producto.lineaId
                                                }
                                                className="border-bottom pb-3 mb-3"
                                            >

                                                <div className="d-flex justify-content-between gap-3">

                                                    <strong>
                                                        {producto.nombre}
                                                    </strong>

                                                    <strong className="text-success text-nowrap">

                                                        ₡{" "}
                                                        {subtotal.toLocaleString(
                                                            "es-CR"
                                                        )}

                                                    </strong>

                                                </div>

                                                {/* EXTRAS */}

                                                {producto.extras
                                                    ?.map(
                                                        extra => (

                                                            <div
                                                                key={
                                                                    extra.productoId
                                                                }
                                                                className="small text-success"
                                                            >

                                                                ➕ {extra.nombre}

                                                                {" "}

                                                                <span className="text-muted">

                                                                    ₡{" "}
                                                                    {extra.precio
                                                                        .toLocaleString(
                                                                            "es-CR"
                                                                        )}

                                                                </span>

                                                            </div>

                                                        )
                                                    )}

                                                {/* CANTIDAD */}

                                                {!producto.esPersonalizado ? (

                                                    <div className="d-flex align-items-center justify-content-between mt-2">

                                                        <div>

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

                                                            <strong className="mx-3">
                                                                {producto.cantidad}
                                                            </strong>

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
                                                            🗑️
                                                        </button>

                                                    </div>

                                                ) : (

                                                    <div className="d-flex justify-content-between mt-2">

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
                                                            🗑️
                                                        </button>

                                                    </div>

                                                )}

                                                {/* OBSERVACIONES */}

                                                <input
                                                    className="form-control form-control-sm mt-2"
                                                    placeholder="Ej. Sin cebolla..."
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
                                    }
                                )

                            )}

                        </div>

                        {/* ====================================== */}
                        {/* FOOTER */}
                        {/* ====================================== */}

                        <div className="card-footer bg-white">

                            <div className="d-flex justify-content-between align-items-center mb-3">

                                <h5 className="mb-0">
                                    Total
                                </h5>

                                <h3 className="text-success fw-bold mb-0">

                                    ₡{" "}
                                    {total.toLocaleString(
                                        "es-CR"
                                    )}

                                </h3>

                            </div>

                            <button
                                type="button"
                                className="btn btn-success btn-lg w-100"
                                disabled={
                                    carrito.length === 0 ||
                                    enviando
                                }
                                onClick={
                                    registrarVenta
                                }
                            >

                                {
                                    enviando
                                        ? "Registrando..."
                                        : "✅ Registrar venta"
                                }

                            </button>

                        </div>

                    </div>

                </div>

            </div>

            {/* ====================================== */}
            {/* IR AL CARRITO */}
            {/* ====================================== */}

            {
                carrito.length > 0 &&
                !carritoVisible && (

                    <button
                        type="button"
                        onClick={
                            irAlCarrito
                        }
                        className="btn btn-success shadow-lg position-fixed"
                        style={{
                            bottom: "22px",
                            left: "50%",
                            transform:
                                "translateX(-50%)",
                            zIndex: 1040,
                            borderRadius: "50px",
                            padding: "12px 22px",
                            minWidth: "250px",
                            maxWidth: "90vw"
                        }}
                    >

                        <div className="d-flex align-items-center justify-content-center gap-2">

                            <span
                                style={{
                                    fontSize: "1.4rem"
                                }}
                            >
                                🛒
                            </span>

                            <div className="text-start">

                                <div className="fw-bold">

                                    {cantidadArticulos}{" "}

                                    {
                                        cantidadArticulos === 1
                                            ? "producto"
                                            : "productos"
                                    }

                                    {" · "}

                                    ₡
                                    {total.toLocaleString(
                                        "es-CR"
                                    )}

                                </div>

                                <small>
                                    Ir al carrito ↓
                                </small>

                            </div>

                        </div>

                    </button>

                )
            }

            {/* ====================================== */}
            {/* IR AL MENÚ */}
            {/* ====================================== */}

            {
                carrito.length > 0 &&
                carritoVisible &&
                !menuVisible && (

                    <button
                        type="button"
                        onClick={
                            irAlMenu
                        }
                        className="btn btn-dark shadow-lg position-fixed"
                        style={{
                            bottom: "22px",
                            left: "50%",
                            transform:
                                "translateX(-50%)",
                            zIndex: 1040,
                            borderRadius: "50px",
                            padding: "12px 24px"
                        }}
                    >
                        🍔 Ir al menú ↑
                    </button>

                )
            }

            {/* ====================================== */}
            {/* MODAL EXTRAS */}
            {/* ====================================== */}

            {productoSeleccionado && (

                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(0,0,0,.55)"
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title">
                                        {
                                            productoSeleccionado
                                                .nombre
                                        }
                                    </h5>

                                    <small className="text-muted">
                                        Selecciona tus extras
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

                            <div
                                className="modal-body"
                                style={{
                                    maxHeight: "60vh",
                                    overflowY: "auto"
                                }}
                            >

                                {
                                    extrasDisponibles
                                        .length === 0 && (

                                        <div className="text-muted">

                                            No hay extras disponibles.

                                        </div>

                                    )
                                }

                                {extrasDisponibles.map(
                                    extra => {

                                        const seleccionado =
                                            extrasSeleccionados
                                                .some(
                                                    item =>
                                                        item.id ===
                                                        extra.id
                                                );

                                        return (

                                            <label
                                                key={
                                                    extra.id
                                                }
                                                className="d-flex justify-content-between align-items-center border-bottom py-3"
                                                style={{
                                                    cursor: "pointer"
                                                }}
                                            >

                                                <div>

                                                    <strong>
                                                        {extra.nombre}
                                                    </strong>

                                                    <div className="text-muted">

                                                        + ₡{" "}

                                                        {Number(
                                                            extra.precio
                                                        ).toLocaleString(
                                                            "es-CR"
                                                        )}

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

                                            </label>

                                        );
                                    }
                                )}

                            </div>

                            <div
                                className="modal-footer bg-white border-top"
                                style={{
                                    position: "sticky",
                                    bottom: 0,
                                    zIndex: 10
                                }}
                            >

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={
                                        cerrarExtras
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-success flex-grow-1"
                                    onClick={
                                        confirmarProductoConExtras
                                    }
                                >

                                    ✅ Agregar a la venta

                                    {
                                        extrasSeleccionados.length > 0 &&
                                        ` (${extrasSeleccionados.length} extras)`
                                    }

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

export default VentaRapida;