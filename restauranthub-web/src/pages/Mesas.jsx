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

    // Mesa pendiente de liberar
    const [
        mesaLiberar,
        setMesaLiberar
    ] = useState(null);

    const [
        liberando,
        setLiberando
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
                await api.get("/Mesas/admin");

            setMesas(respuesta.data);

        }
        catch (error) {

            console.error(
                "Error cargando mesas:",
                error
            );

            showToast(
                error.response?.data ||
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

            const estado =
                mesa.status
                    ?.toLowerCase() ?? "";

            const texto =
                busqueda
                    .toLowerCase()
                    .trim();

            return (
                numero.includes(texto) ||
                restaurante.includes(texto) ||
                estado.includes(texto)
            );
        });

    // ==========================================
    // GUARDAR CAMBIOS DE MESA
    // ==========================================

    const guardarMesa = async (mesa) => {

        try {

            await api.put(
                `/Mesas/${mesa.id}`,
                {
                    number: mesa.number,
                    status: mesa.status
                }
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

            // Restauramos valores reales de BD
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
    // LIBERAR MESA
    // ==========================================

    const liberarMesa = async () => {

        if (!mesaLiberar || liberando)
            return;

        try {

            setLiberando(true);

            await api.put(
                `/Mesas/${mesaLiberar.id}/liberar`
            );

            // Actualizamos inmediatamente
            // el estado visual.
            setMesas(prev =>
                prev.map(mesa =>
                    mesa.id === mesaLiberar.id
                        ? {
                            ...mesa,
                            status: "Disponible"
                        }
                        : mesa
                )
            );

            showToast(
                `Mesa #${mesaLiberar.number} liberada correctamente.`,
                "success"
            );

            setMesaLiberar(null);

        }
        catch (error) {

            console.error(
                "Error liberando mesa:",
                error
            );

            showToast(
                error.response?.data ||
                "No fue posible liberar la mesa.",
                "error"
            );
        }
        finally {

            setLiberando(false);
        }
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

                                    <th style={{ width: "120px" }}>
                                        Número
                                    </th>

                                    <th>
                                        Restaurante
                                    </th>

                                    <th style={{ width: "130px" }}>
                                        Código QR
                                    </th>

                                    <th style={{ width: "160px" }}>
                                        Estado
                                    </th>

                                    <th style={{ width: "160px" }}>
                                        Acción
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
                                                    value={mesa.number}
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
                                                        guardarMesa(mesa)
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

                                                        setMostrarQR(true);
                                                    }}
                                                >

                                                    <i className="bi bi-qr-code me-1"></i>

                                                    Ver

                                                </button>

                                            </td>

                                            {/* ESTADO */}

                                            <td>

                                                {mesa.status === "Disponible" ? (

                                                    <span className="badge bg-success">
                                                        🟢 Disponible
                                                    </span>

                                                ) : (

                                                    <span className="badge bg-danger">
                                                        🔴 Ocupada
                                                    </span>

                                                )}

                                            </td>

                                            {/* ACCIÓN */}

                                            <td>

                                                {mesa.status === "Ocupada" ? (

                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() =>
                                                            setMesaLiberar(mesa)
                                                        }
                                                    >
                                                        <i className="bi bi-unlock me-1"></i>
                                                        Liberar mesa
                                                    </button>

                                                ) : (

                                                    <span className="text-muted small">
                                                        —
                                                    </span>

                                                )}

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
            {/* MODAL CONFIRMAR LIBERAR MESA */}
            {/* ====================================== */}

            {mesaLiberar && (

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
                                    ⚠️ Liberar mesa
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    disabled={liberando}
                                    onClick={() =>
                                        setMesaLiberar(null)
                                    }
                                />

                            </div>

                            <div className="modal-body">

                                <p>
                                    ¿Está seguro que desea liberar la
                                    <strong>
                                        {" "}Mesa #{mesaLiberar.number}
                                    </strong>?
                                </p>

                                <div className="alert alert-warning mb-0">

                                    Utilice esta opción únicamente
                                    si la mesa quedó ocupada por error.

                                    <br />

                                    Si existe un pedido activo para
                                    esta mesa, el sistema no permitirá
                                    liberarla.

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={liberando}
                                    onClick={() =>
                                        setMesaLiberar(null)
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    disabled={liberando}
                                    onClick={liberarMesa}
                                >

                                    {liberando
                                        ? "Liberando..."
                                        : "🔓 Sí, liberar mesa"
                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


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