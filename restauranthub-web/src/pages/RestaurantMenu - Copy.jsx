import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useParams
} from "react-router-dom";

import api from "../services/api";

function PublicMenu() {

    const { id } =
        useParams();

    // =========================
    // RESTAURANTE / PRODUCTOS
    // =========================

    const [restaurant, setRestaurant] =
        useState(null);

    const [productos, setProductos] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [busqueda, setBusqueda] =
        useState("");

    const [categoriaSeleccionada, setCategoriaSeleccionada] =
        useState("Todos");

    // =========================
    // CARRITO
    // =========================

    const [carrito, setCarrito] =
        useState([]);

    // =========================
    // CLIENTE
    // =========================

    const [nombre, setNombre] =
        useState("");

    const [telefono, setTelefono] =
        useState("");

    // =========================
    // MODAL EXTRAS
    // =========================

    const [
        productoSeleccionado,
        setProductoSeleccionado
    ] = useState(null);

    const [
        extrasSeleccionados,
        setExtrasSeleccionados
    ] = useState([]);

    // =========================
    // PEDIDO CREADO
    // =========================

    const [pedidoCreado, setPedidoCreado] =
        useState(null);

    const [enviando, setEnviando] =
        useState(false);

    /*
     * Candado real contra doble toque
     * en móvil.
     */
    const creandoRef =
        useRef(false);

    // =========================
    // CARGAR MENU
    // =========================

    useEffect(() => {
        cargarMenu();
    }, [id]);

    const cargarMenu = async () => {

        try {

            setLoading(true);
            const respuesta =
                await api.get(
                    `/Menu/publico/restaurante/${id}`
                );

            setRestaurant(
                respuesta.data.restaurant
            );

            setProductos(
                respuesta.data.productos
            );
        }
        catch (error) {

            console.error(error);

            alert(
                "No fue posible cargar el menú."
            );
        }
        finally {

            setLoading(false);
        }
    };

    // =========================
    // TELEFONO
    // =========================

    const cambiarTelefono = (
        valor
    ) => {

        let numeros =
            valor.replace(
                /\D/g,
                ""
            );

        /*
         * Si pegan:
         *
         * +506 6066-2375
         *
         * nos quedamos con:
         *
         * 60662375
         */
        if (
            numeros.length > 8
        ) {
            numeros =
                numeros.slice(-8);
        }

        setTelefono(
            numeros
        );
    };

    // =========================
    // CATEGORIAS DE EXTRAS
    // =========================

    const categoriasExtrasIds =
        new Set(
            productos
                .map(
                    p =>
                        p.categoriaExtrasId
                )
                .filter(
                    id =>
                        id != null
                )
        );

    /*
     * No mostramos los extras
     * como productos normales.
     */
    const productosVisibles =
        productos.filter(
            p =>
                !categoriasExtrasIds.has(
                    p.categoriaId
                )
        );

    // =========================
    // CATEGORIAS DEL MENU
    // =========================

    const categorias = [
        "Todos",

        ...new Set(
            productosVisibles

                .map(
                    p =>
                        p.categoria
                )

                .filter(
                    c =>
                        c &&
                        c.trim() !== ""
                )
        )
    ];

    // =========================
    // FILTRAR MENU
    // =========================

    const productosFiltrados =
        productosVisibles.filter(
            producto => {

                const texto =
                    busqueda
                        .toLowerCase()
                        .trim();

                const coincideBusqueda =
                    producto.nombre
                        ?.toLowerCase()
                        .includes(
                            texto
                        ) ||

                    producto.descripcion
                        ?.toLowerCase()
                        .includes(
                            texto
                        );

                const coincideCategoria =
                    categoriaSeleccionada ===
                        "Todos" ||

                    producto.categoria ===
                        categoriaSeleccionada;

                return (
                    coincideBusqueda &&
                    coincideCategoria
                );
            }
        );

    // =========================
    // EXTRAS DISPONIBLES
    // =========================

    const extrasDisponibles =
        productoSeleccionado

            ? productos.filter(
                p =>
                    p.categoriaId ===
                    productoSeleccionado
                        .categoriaExtrasId
            )

            : [];

    // =========================
    // ABRIR EXTRAS
    // =========================

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

    const cerrarExtras = () => {

        setProductoSeleccionado(
            null
        );

        setExtrasSeleccionados(
            []
        );
    };

    const seleccionarExtra = (
        extra
    ) => {

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
    // AGREGAR NORMAL
    // =========================

    const agregarProductoNormal =
        producto => {

            setCarrito(
                actual => {

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
                                            p.cantidad +
                                            1
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

    // =========================
    // AGREGAR PRODUCTO
    // =========================

    const agregarProducto =
        producto => {

            if (
                producto.categoriaExtrasId !=
                null
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

    // =========================
    // CONFIRMAR EXTRAS
    // =========================

    const confirmarProductoConExtras =
        () => {

            if (
                !productoSeleccionado
            )
                return;

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

    // =========================
    // CANTIDAD
    // =========================

    const cambiarCantidad = (
        lineaId,
        cantidad
    ) => {

        if (
            cantidad <= 0
        ) {

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
    // ELIMINAR
    // =========================

    const eliminarLinea =
        lineaId => {

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
    // OBSERVACIONES
    // =========================

    const cambiarObservaciones = (
        lineaId,
        observaciones
    ) => {

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
    // TOTAL
    // =========================

    const total =
        carrito.reduce(
            (
                suma,
                producto
            ) => {

                const subtotalProducto =
                    Number(
                        producto.precio ??
                        0
                    ) *

                    Number(
                        producto.cantidad ??
                        0
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
                                        extra.precio ??
                                        0
                                    ) *

                                    Number(
                                        extra.cantidad ??
                                        0
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

    // =========================
    // CREAR PEDIDO
    // =========================

    const crearPedido = async () => {

        if (
            creandoRef.current
        )
            return;

        if (
            !nombre.trim()
        ) {

            alert(
                "Ingrese su nombre."
            );

            return;
        }

        if (
            telefono.length !== 8
        ) {

            alert(
                "Ingrese un teléfono de 8 dígitos."
            );

            return;
        }

        if (
            carrito.length === 0
        ) {

            alert(
                "Agregue al menos un producto."
            );

            return;
        }

        creandoRef.current =
            true;

        setEnviando(
            true
        );

        try {

            const dto = {

                restaurantId:
                    Number(
                        id
                    ),

                nombre:
                    nombre.trim(),

                telefono,

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
                    "/Pedidos/publico",
                    dto
                );

            setPedidoCreado(
                respuesta.data
            );

            setCarrito([]);
        }
        catch (error) {

            console.error(error);

            alert(
                error.response?.data ||
                "No fue posible enviar el pedido."
            );
        }
        finally {

            creandoRef.current =
                false;

            setEnviando(
                false
            );
        }
    };

    // =========================
    // WHATSAPP
    // =========================

    const confirmarWhatsApp =
        () => {

            if (
                !pedidoCreado
            )
                return;

            let numero =
                String(
                    pedidoCreado
                        .telefonoRestaurant ??
                    restaurant?.phone ??
                    ""
                )
                    .replace(
                        /\D/g,
                        ""
                    );

            /*
             * Si el restaurante tiene
             * guardado únicamente
             * el número nacional.
             */
            if (
                numero.length === 8
            ) {

                numero =
                    `506${numero}`;
            }

            const mensaje =
                `Hola 👋\n\n` +
                `Acabo de realizar el pedido #${pedidoCreado.numeroPedido} ` +
                `por medio de Sin Filas.\n\n` +
                `Nombre: ${nombre}\n` +
                `Total: ₡${Number(
                    pedidoCreado.total
                ).toLocaleString()}\n\n` +
                `Estoy confirmando mi pedido para pasar a recoger. 😊`;

            const url =
                `https://wa.me/${numero}` +
                `?text=${encodeURIComponent(
                    mensaje
                )}`;

            window.open(
                url,
                "_blank"
            );
        };

    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (

            <div className="container py-5 text-center">

                <div className="spinner-border text-success"></div>

                <h5 className="mt-3">
                    Cargando menú...
                </h5>

            </div>
        );
    }

    // =========================
    // PEDIDO CREADO
    // =========================

    if (pedidoCreado) {

        return (

            <div className="container py-5">

                <div className="row justify-content-center">

                    <div className="col-md-7 col-lg-5">

                        <div className="card shadow border-0 rounded-4">

                            <div className="card-body text-center p-4">

                                <div
                                    style={{
                                        fontSize:
                                            "4rem"
                                    }}
                                >
                                    ✅
                                </div>

                                <h2 className="fw-bold mt-2">
                                    ¡Pedido recibido!
                                </h2>

                                <p className="text-muted">
                                    Tu pedido fue enviado al restaurante.
                                </p>

                                <div className="border rounded-4 p-4 my-4">

                                    <div className="text-muted">
                                        Número de pedido
                                    </div>

                                    <h1 className="fw-bold">
                                        #
                                        {
                                            pedidoCreado
                                                .numeroPedido
                                                .toString()
                                                .padStart(
                                                    3,
                                                    "0"
                                                )
                                        }
                                    </h1>

                                    <div className="text-muted">
                                        Total
                                    </div>

                                    <h3 className="text-success fw-bold">

                                        ₡ {
                                            Number(
                                                pedidoCreado.total
                                            )
                                                .toLocaleString()
                                        }

                                    </h3>

                                    <span className="badge bg-warning text-dark mt-2">

                                        🥡 Pasa a llevar

                                    </span>

                                </div>

                                <button
                                    type="button"
                                    className="btn btn-success btn-lg w-100"
                                    onClick={
                                        confirmarWhatsApp
                                    }
                                >

                                    📲 Confirmar por WhatsApp

                                </button>

                                <p className="small text-muted mt-3">

                                    Confirma tu pedido por WhatsApp
                                    para que el restaurante sepa que
                                    estarás pasando a recogerlo.

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // =========================
    // MENU
    // =========================

    return (

        <div className="container py-4">

            {/* RESTAURANTE */}

            <div className="text-center mb-4">

                <h1 className="fw-bold">

                    🍔 {
                        restaurant?.name
                    }

                </h1>

                <p className="text-muted">

                    Ordena aquí y pasa a recoger.

                </p>

            </div>

            {/* BUSCADOR */}

            <input
                className="form-control form-control-lg mb-3"
                placeholder="🔍 Buscar producto..."
                value={
                    busqueda
                }
                onChange={
                    e =>
                        setBusqueda(
                            e.target.value
                        )
                }
            />

            {/* CATEGORIAS */}

            <div className="d-flex flex-wrap gap-2 mb-4">

                {categorias.map(
                    categoria => (

                        <button
                            type="button"
                            key={
                                categoria
                            }
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

                            {
                                categoria
                            }

                        </button>

                    )
                )}

            </div>

            <div className="row">

                {/* PRODUCTOS */}

                <div className="col-lg-7">

                    <div className="row g-3">

                        {productosFiltrados.map(
                            producto => (

                                <div
                                    className="col-md-6"
                                    key={
                                        producto.id
                                    }
                                >

                                    <div className="card shadow-sm border-0 h-100 rounded-4">

                                        <div className="card-body">

                                            <h5 className="fw-bold">

                                                {
                                                    producto.nombre
                                                }

                                            </h5>

                                            {producto.descripcion && (

                                                <p className="text-muted">

                                                    {
                                                        producto.descripcion
                                                    }

                                                </p>

                                            )}

                                            <h5 className="text-success fw-bold">

                                                ₡ {
                                                    Number(
                                                        producto.precio
                                                    )
                                                        .toLocaleString()
                                                }

                                            </h5>

                                            <button
                                                type="button"
                                                className="btn btn-success w-100 mt-3"
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

                {/* CARRITO */}

                <div className="col-lg-5 mt-4 mt-lg-0">

                    <div
                        className="card shadow border-0 rounded-4"
                        style={{
                            position:
                                "sticky",

                            top:
                                "20px"
                        }}
                    >

                        <div className="card-header bg-dark text-white">

                            <h5 className="mb-0">

                                🛒 Tu pedido

                                {cantidadArticulos > 0 && (

                                    <span className="badge bg-success ms-2">

                                        {
                                            cantidadArticulos
                                        }

                                    </span>

                                )}

                            </h5>

                        </div>

                        <div className="card-body">

                            {carrito.length === 0 ? (

                                <div className="text-center text-muted py-4">

                                    🛒

                                    <p className="mb-0 mt-2">

                                        Tu carrito está vacío.

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
                                                        extra.precio *
                                                        extra.cantidad,

                                                    0
                                                ) ?? 0;

                                        const subtotal =
                                            producto.precio *
                                            producto.cantidad +
                                            subtotalExtras;

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

                                                    <strong className="text-success">

                                                        ₡ {
                                                            subtotal
                                                                .toLocaleString()
                                                        }

                                                    </strong>

                                                </div>

                                                {producto.extras?.map(
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

                                                        </div>

                                                    )
                                                )}

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

                                                                {
                                                                    producto.cantidad
                                                                }

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

                            {/* TOTAL */}

                            <div className="d-flex justify-content-between">

                                <strong>
                                    Total
                                </strong>

                                <strong className="fs-4 text-success">

                                    ₡ {
                                        total
                                            .toLocaleString()
                                    }

                                </strong>

                            </div>

                            {/* DATOS CLIENTE */}

                            {carrito.length > 0 && (

                                <div className="border-top mt-4 pt-4">

                                    <h5 className="fw-bold">

                                        👤 Tus datos

                                    </h5>

                                    <input
                                        className="form-control mb-3"
                                        placeholder="Tu nombre"
                                        value={
                                            nombre
                                        }
                                        onChange={
                                            e =>
                                                setNombre(
                                                    e.target.value
                                                )
                                        }
                                    />

                                    <div className="input-group mb-3">

                                        <span className="input-group-text">

                                            🇨🇷

                                        </span>

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength="8"
                                            className="form-control"
                                            placeholder="88888888"
                                            value={
                                                telefono
                                            }
                                            onChange={
                                                e =>
                                                    cambiarTelefono(
                                                        e.target.value
                                                    )
                                            }
                                        />

                                    </div>

                                    <div className="alert alert-warning">

                                        🥡 Este pedido es para
                                        <strong>
                                            {" "}pasar a recoger
                                        </strong>
                                        .

                                    </div>

<button
   className="btn btn-secondary btn-lg w-100"
   disabled
>
   ⏸️ Pedidos en línea temporalmente pausados
</button>

                                </div>

                            )}

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

                            <div className="modal-body">

                                {extrasDisponibles.map(
                                    extra => {

                                        const seleccionado =
                                            extrasSeleccionados
                                                .some(
                                                    e =>
                                                        e.id ===
                                                        extra.id
                                                );

                                        return (

                                            <label
                                                key={
                                                    extra.id
                                                }
                                                className="d-flex justify-content-between align-items-center border-bottom py-3"
                                                style={{
                                                    cursor:
                                                        "pointer"
                                                }}
                                            >

                                                <div>

                                                    <strong>

                                                        {
                                                            extra.nombre
                                                        }

                                                    </strong>

                                                    <div className="text-muted">

                                                        + ₡ {
                                                            Number(
                                                                extra.precio
                                                            )
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

                                            </label>

                                        );
                                    }
                                )}

                            </div>

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
                                    onClick={
                                        confirmarProductoConExtras
                                    }
                                >

                                    Agregar al pedido

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default PublicMenu;