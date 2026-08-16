import {
    useEffect,
    useRef,
    useState
} from "react";

import { useNavigate } from "react-router-dom";
import api from "../services/api";

function PedidoXpress() {

    const navigate = useNavigate();

    // =========================
    // CLIENTE
    // =========================

    const [telefono, setTelefono] =
        useState("");

    const [cliente, setCliente] =
        useState(null);

    const [nombre, setNombre] =
        useState("");

    const [direccion, setDireccion] =
        useState("");

    const [tipoPedido, setTipoPedido] =
        useState("Xpress");

    // =========================
    // PRODUCTOS / CARRITO
    // =========================

    const [productos, setProductos] =
        useState([]);

    const [carrito, setCarrito] =
        useState([]);

    const [busqueda, setBusqueda] =
        useState("");

    // =========================
    // ESTADOS UI
    // =========================

    const [buscandoCliente, setBuscandoCliente] =
        useState(false);

    const [guardandoCliente, setGuardandoCliente] =
        useState(false);

    const [guardandoPedido, setGuardandoPedido] =
        useState(false);

    /*
     * Candado real contra doble ejecución.
     *
     * No depende del re-render de React.
     */
    const creandoPedidoRef =
        useRef(false);

    // =========================
    // MODAL EXTRAS
    // =========================

    const [productoSeleccionado, setProductoSeleccionado] =
        useState(null);

    const [extrasSeleccionados, setExtrasSeleccionados] =
        useState([]);

    // =========================
    // CARGAR PRODUCTOS
    // =========================

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {

        try {

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

            alert(
                "No fue posible cargar los productos."
            );
        }
    };

    // =========================
    // CAMBIAR TELÉFONO
    // =========================

    /*
     * IMPORTANTE:
     *
     * Si habían buscado un cliente y luego
     * escriben otro teléfono, eliminamos
     * inmediatamente la referencia al
     * cliente anterior.
     *
     * Esto evita reutilizar accidentalmente
     * el ClienteId anterior.
     */
const cambiarTelefono = (valor) => {
   // Dejar únicamente números
   let numeros =
       valor.replace(/\D/g, "");
   // Si pegaron +506XXXXXXXX
   // nos quedamos con los últimos 8 dígitos
   if (numeros.length > 8) {
       numeros =
           numeros.slice(-8);
   }
   setTelefono(numeros);
   // Invalidamos cualquier cliente anterior
   setCliente(null);
   setNombre("");
   setDireccion("");
};

    // =========================
    // BUSCAR CLIENTE
    // =========================

const buscarCliente = async (
   telefonoBuscar = telefono
) => {
   const telefonoBusqueda =
       telefonoBuscar.trim();
   if (telefonoBusqueda.length !== 8)
       return;
   try {
       setBuscandoCliente(true);
       const respuesta =
           await api.get(
               `/Clientes/cliente/${telefonoBusqueda}`
           );
       const encontrado =
           respuesta.data;
       setCliente(encontrado);
       setNombre(
           encontrado.nombreCompleto ?? ""
       );
       setDireccion(
           encontrado.direccion ?? ""
       );
   }
   catch (error) {
       if (
           error.response?.status === 404
       ) {
           setCliente(null);
           setNombre("");
           setDireccion("");
           // Yo NO pondría alert aquí.
           // Como la búsqueda ahora es automática,
           // mejor simplemente mostrar
           // "Cliente nuevo" en pantalla.
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

const manejarCambioTelefono = (
   valor
) => {
   let numeros =
       valor.replace(/\D/g, "");
   if (numeros.length > 8) {
       numeros =
           numeros.slice(-8);
   }
   cambiarTelefono(numeros);
   // Al completar los 8 dígitos,
   // buscar automáticamente.
   if (numeros.length === 8) {
       buscarCliente(numeros);
   }
};

    // =========================
    // GUARDAR CLIENTE
    // =========================

    const guardarCliente = async () => {

        if (!telefono.trim()) {

            alert(
                "Ingrese el teléfono."
            );

            return null;
        }

        if (!nombre.trim()) {

            alert(
                "Ingrese el nombre."
            );

            return null;
        }

        /*
         * Solo Xpress requiere dirección.
         */
        if (
            tipoPedido === "Xpress" &&
            !direccion.trim()
        ) {

            alert(
                "Ingrese la dirección de entrega."
            );

            return null;
        }

        try {

            setGuardandoCliente(true);

            const respuesta =
                await api.post(
                    "/Clientes/cliente",
                    {
                        telefono:
                            telefono.trim(),

                        nombreCompleto:
                            nombre.trim(),

                        direccion:
                            direccion.trim()
                    }
                );

            const nuevoCliente =
                respuesta.data;

            setCliente(
                nuevoCliente
            );

            return nuevoCliente;
        }
        catch (error) {

            console.error(error);

            alert(
                error.response?.data ||
                "No fue posible guardar el cliente."
            );

            return null;
        }
        finally {

            setGuardandoCliente(false);
        }
    };

    // =========================
    // ACTUALIZAR CLIENTE
    // =========================

    const actualizarClienteExistente =
        async () => {

            if (!cliente)
                return null;

            try {

                const clienteActualizado = {

                    id:
                        cliente.id,

                    telefono:
                        telefono.trim(),

                    nombreCompleto:
                        nombre.trim(),

                    direccion:
                        direccion.trim(),

                    latitud:
                        cliente.latitud ?? null,

                    longitud:
                        cliente.longitud ?? null
                };

                await api.put(
                    `/Clientes/${cliente.id}`,
                    clienteActualizado
                );

                const actualizado = {
                    ...cliente,
                    ...clienteActualizado
                };

                setCliente(
                    actualizado
                );

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
    // CATEGORÍAS DE EXTRAS
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
     * Productos utilizados exclusivamente
     * como extras no aparecen en el menú.
     */
    const productosVisibles =
        productos.filter(
            p =>
                !categoriasExtrasIds.has(
                    p.categoriaId
                )
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
    // MODAL EXTRAS
    // =========================

    const abrirExtras = (producto) => {

        setProductoSeleccionado(
            producto
        );

        setExtrasSeleccionados([]);
    };

    const cerrarExtras = () => {

        setProductoSeleccionado(
            null
        );

        setExtrasSeleccionados([]);
    };

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
    // AGREGAR PRODUCTO NORMAL
    // =========================

    const agregarProductoNormal =
        (producto) => {

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

    const agregarProducto = (
        producto
    ) => {

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

    // =========================
    // CONFIRMAR PRODUCTO
    // CON EXTRAS
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
                                extra.precio,

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
    // CAMBIAR CANTIDAD
    // =========================

    const cambiarCantidad = (
        lineaId,
        cantidad
    ) => {

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
    // ELIMINAR LÍNEA
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

                const totalProducto =
                    Number(
                        producto.precio ?? 0
                    ) *
                    Number(
                        producto.cantidad ?? 0
                    );

                const totalExtras =
                    producto.extras?.reduce(
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
                    totalProducto +
                    totalExtras
                );
            },

            0
        );

    // =========================
    // CREAR PEDIDO
    // =========================

    const crearPedido = async () => {

        /*
         * Candado contra doble toque.
         */
        if (
            creandoPedidoRef.current
        ) {
            return;
        }

        // =========================
        // VALIDACIONES
        // =========================

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

        if (
            tipoPedido === "Xpress" &&
            !direccion.trim()
        ) {

            alert(
                "Ingrese la dirección de entrega."
            );

            return;
        }

        if (
            carrito.length === 0
        ) {

            alert(
                "Debe agregar al menos un producto."
            );

            return;
        }

        /*
         * Desde este punto solamente una
         * ejecución puede continuar.
         */
        creandoPedidoRef.current =
            true;

        setGuardandoPedido(
            true
        );

        try {

            let clienteActual =
                cliente;

            // =========================
            // SEGURIDAD CLIENTE
            // =========================

            /*
             * Si por alguna razón React todavía
             * tuviese un cliente anterior cuya
             * identificación telefónica no
             * coincide, lo descartamos.
             */
            if (
                clienteActual &&
                String(
                    clienteActual.telefono ?? ""
                ).trim() !==
                telefono.trim()
            ) {

                clienteActual =
                    null;

                setCliente(
                    null
                );
            }

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
                    nombre.trim() !==
                    (
                        clienteActual
                            .nombreCompleto ?? ""
                    ).trim();

                const cambioDireccion =
                    direccion.trim() !==
                    (
                        clienteActual
                            .direccion ?? ""
                    ).trim();

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
            // ARMAR PEDIDO
            // =========================

            const dto = {

                tipoPedido,

                mesaId:
                    null,

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
                "Cliente del pedido:",
                {
                    id:
                        clienteActual.id,

                    telefono:
                        clienteActual.telefono,

                    nombre:
                        clienteActual.nombreCompleto
                }
            );

            console.log(
                "Pedido enviado:"
            );

            console.log(
                JSON.stringify(
                    dto,
                    null,
                    2
                )
            );

            // =========================
            // CREAR PEDIDO
            // =========================

            const respuesta =
                await api.post(
                    "/Pedidos",
                    dto
                );

            alert(
                `Pedido #${respuesta.data.numeroPedido} creado correctamente.`
            );

            // =========================
            // LIMPIAR TODO
            // =========================

            setTelefono("");
            setCliente(null);
            setNombre("");
            setDireccion("");

            setTipoPedido(
                "Xpress"
            );

            setCarrito([]);
            setBusqueda("");

            cerrarExtras();

            // =========================
            // VOLVER A PEDIDOS
            // =========================

            navigate(
                "/pedidos"
            );
        }
        catch (error) {

            console.error(error);

            alert(
                error.response?.data ||
                "No fue posible crear el pedido."
            );
        }
        finally {

            /*
             * Liberamos ambos bloqueos.
             */
            creandoPedidoRef.current =
                false;

            setGuardandoPedido(
                false
            );
        }
    };

    // =========================
    // FILTRAR PRODUCTOS
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
                        .includes(
                            texto
                        ) ||

                    p.categoria
                        ?.toLowerCase()
                        .includes(
                            texto
                        )
                );
            }
        );

    // =========================
    // UI
    // =========================

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
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() =>
                        navigate(
                            "/pedidos"
                        )
                    }
                >
                    ← Pedidos
                </button>

            </div>

            {/* ========================= */}
            {/* CLIENTE */}
            {/* ========================= */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-header bg-success text-white">

                    <h5 className="mb-0">
                        👤 Información del cliente
                    </h5>

                </div>

                <div className="card-body">

                    <div className="row g-3">

{/* TELÉFONO */}

<div className="col-md-5">

    <label className="form-label">
        Teléfono
    </label>

    <div className="input-group">

        <span
            className="input-group-text"
            style={{
                fontSize: "1.3rem"
            }}
        >
            🇨🇷
        </span>

        <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="8"
            className="form-control"
            placeholder="60663487"
            value={telefono}
            onChange={
                e =>
                    manejarCambioTelefono(
                        e.target.value
                    )
            }
        />

        {buscandoCliente && (

            <span className="input-group-text">

                <span
                    className="spinner-border spinner-border-sm text-success"
                    role="status"
                />

            </span>

        )}

    </div>

    <div className="form-text">
        Número de Costa Rica, 8 dígitos.
    </div>

</div>

                        {/* RESULTADO CLIENTE */}

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

                        {/* NOMBRE */}

                        <div className="col-md-5">

                            <label className="form-label">
                                Nombre completo
                            </label>

                            <input
                                className="form-control"
                                value={
                                    nombre
                                }
                                onChange={
                                    e =>
                                        setNombre(
                                            e.target.value
                                        )
                                }
                                placeholder="Nombre del cliente"
                            />

                        </div>

                        {/* TIPO PEDIDO */}

                        <div className="col-12">

                            <label className="form-label fw-semibold">
                                ¿Cómo recibe el pedido?
                            </label>

                            <div className="row g-2">

                                <div className="col-md-6">

                                    <button
                                        type="button"
                                        className={
                                            tipoPedido ===
                                                "Xpress"

                                                ? "btn btn-success w-100 p-3"

                                                : "btn btn-outline-success w-100 p-3"
                                        }
                                        onClick={() =>
                                            setTipoPedido(
                                                "Xpress"
                                            )
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
                                            tipoPedido ===
                                                "Llevar"

                                                ? "btn btn-warning w-100 p-3"

                                                : "btn btn-outline-warning w-100 p-3"
                                        }
                                        onClick={() =>
                                            setTipoPedido(
                                                "Llevar"
                                            )
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

                        {/* DIRECCIÓN */}

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
                                    value={
                                        direccion
                                    }
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
                                        El cliente pasará al restaurante a recoger el pedido.
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

            {/* ========================= */}
            {/* PRODUCTOS + PEDIDO */}
            {/* ========================= */}

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

                            <div className="row g-2">

                                {productosFiltrados.map(
                                    producto => (

                                        <div
                                            className="col-md-6"
                                            key={
                                                producto.id
                                            }
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
                                                        producto.precio
                                                            .toLocaleString()
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

                            {
                                productosFiltrados.length ===
                                    0 && (

                                    <p className="text-center text-muted mt-4">
                                        No se encontraron productos.
                                    </p>

                                )
                            }

                        </div>

                    </div>

                </div>

                {/* CARRITO */}

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
                                            fontSize:
                                                "3rem"
                                        }}
                                    >
                                        🛒
                                    </div>

                                    <p className="mb-0">
                                        Agregue productos al pedido.
                                    </p>

                                </div>

                            ) : (

                                carrito.map(
                                    producto => {

                                        const totalExtras =
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
                                                            subtotal
                                                                .toLocaleString()
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
                                                                            extra.precio
                                                                                .toLocaleString()
                                                                        }

                                                                    </span>

                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                                {/* CANTIDAD */}

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
                                                                {
                                                                    producto.cantidad
                                                                }
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

                                                {/* OBSERVACIÓN */}

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
                                    }
                                )

                            )}

                            {/* TOTAL */}

                            <div className="d-flex justify-content-between border-top pt-3">

                                <strong>
                                    Total
                                </strong>

                                <strong className="text-success fs-4">

                                    ₡ {
                                        total
                                            .toLocaleString()
                                    }

                                </strong>

                            </div>

                            {/* CREAR */}

                            <button
                                type="button"
                                className={
                                    tipoPedido ===
                                        "Llevar"

                                        ? "btn btn-warning btn-lg w-100 mt-3"

                                        : "btn btn-success btn-lg w-100 mt-3"
                                }
                                onClick={
                                    crearPedido
                                }
                                disabled={
                                    guardandoPedido ||
                                    guardandoCliente ||
                                    carrito.length === 0
                                }
                            >

                                {
                                    guardandoPedido

                                        ? "⏳ Creando pedido..."

                                        : tipoPedido ===
                                            "Llevar"

                                            ? "🥡 Crear Pedido para Llevar"

                                            : "🛵 Crear Pedido Xpress"
                                }

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
                                            productoSeleccionado
                                                .nombre
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

                                {
                                    extrasDisponibles.length ===
                                        0 && (

                                    <p className="text-muted">

                                        No hay extras disponibles.

                                    </p>

                                )
                                }

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