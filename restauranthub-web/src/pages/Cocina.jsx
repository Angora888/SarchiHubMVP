import { useEffect, useState } from "react";
import api from "../services/api";

function Cocina() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarPedidos();

        const intervalo = setInterval(() => {
            cargarPedidos();
        }, 3000);

        return () => clearInterval(intervalo);
    }, []);

    const cargarPedidos = async () => {
        try {
            const respuesta = await api.get("/Pedidos/cocina");
            setPedidos(respuesta.data);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setLoading(false);
        }
    };

    const comenzarPedido = async (id) => {
        try {
            await api.put(`/Pedidos/${id}/preparando`);
            cargarPedidos();
        }
        catch (error) {
            console.error(error);
            alert("No fue posible iniciar el pedido.");
        }
    };

    const marcarListo = async (id) => {
        try {
            await api.put(`/Pedidos/${id}/listo`);
            cargarPedidos();
        }
        catch (error) {
            console.error(error);
            alert("No fue posible marcar el pedido como listo.");
        }
    };

    const tiempoTranscurrido = (fecha) => {
        const inicio = new Date(fecha);
        const ahora = new Date();

        const minutos = Math.floor(
            (ahora - inicio) / 60000
        );

        return minutos;
    };

    const colorTiempo = (fecha) => {
        const minutos = tiempoTranscurrido(fecha);

        if (minutos < 10) {
            return {
                badge: "success",
                borde: "success",
                fondo: ""
            };
        }

        if (minutos < 20) {
            return {
                badge: "warning",
                borde: "warning",
                fondo: "bg-warning-subtle"
            };
        }

        return {
            badge: "danger",
            borde: "danger",
            fondo: "bg-danger-subtle"
        };
    };

    const pendientes = pedidos.filter(
        p => p.estado === "Pendiente"
    );

    const preparando = pedidos.filter(
        p => p.estado === "Preparando"
    );

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-success"></div>

                <h4 className="mt-3">
                    Cargando pedidos...
                </h4>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">

            <h2 className="text-center fw-bold mb-4">
                🍳 Cocina
            </h2>

            <div className="row">

                {/* PENDIENTES */}

                <div className="col-lg-6">

                    <h3 className="text-warning mb-4">
                        🟡 Pendientes ({pendientes.length})
                    </h3>

                    {pendientes.map(pedido => {

                        const colores = colorTiempo(
                            pedido.fecha
                        );

                        return (
                            <div
                                key={pedido.id}
                                className={`card shadow mb-4 border-${colores.borde} ${colores.fondo}`}
                            >

                                <div className="card-header d-flex justify-content-between align-items-center">

                                    <h4 className="mb-0">

{pedido.tipoPedido === "Mesa" && (
    <>
        <span className="badge bg-primary mb-2">
            🪑 Mesa #{pedido.mesa}
        </span>
    </>
)}

{pedido.tipoPedido === "Xpress" && (
    <>
        <span className="badge bg-success mb-2">
            🛵 Xpress
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>

        {pedido.cliente?.telefono && (
            <div className="small text-muted">
                📱 {pedido.cliente.telefono}
            </div>
        )}
    </>
)}

{pedido.tipoPedido === "Llevar" && (
    <>
        <span className="badge bg-warning text-dark mb-2">
            🥡 Pasa a llevar
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>

        {pedido.cliente?.telefono && (
            <div className="small text-muted">
                📱 {pedido.cliente.telefono}
            </div>
        )}

        <div className="small text-warning-emphasis fw-semibold">
            🏪 Cliente recoge
        </div>
    </>
)}

                                    </h4>

                                    <h4 className="mb-1">
                                        Pedido #
                                        {pedido.numeroPedido
                                            .toString()
                                            .padStart(3, "0")}
                                    </h4>

                                    <span
                                        className={`badge bg-${colores.badge}`}
                                    >
                                        ⏱ {tiempoTranscurrido(
                                            pedido.fecha
                                        )} min
                                    </span>

                                </div>

                                <div className="card-body">

                                    {pedido.detalles.map(
                                        (detalle, index) => (

                                            <div
                                                key={detalle.id ?? index}
                                                className="mb-3"
                                            >

                                                <h5>
                                                    🍽 {detalle.producto}

                                                    <span className="ms-2 badge bg-secondary">
                                                        x{detalle.cantidad}
                                                    </span>
                                                </h5>

                                                {/* EXTRAS */}

                                                {detalle.extras?.length > 0 && (

                                                    <div className="ms-4 mb-2">

                                                        {detalle.extras.map(
                                                            (extra, extraIndex) => (

                                                                <div
                                                                    key={
                                                                        extra.id ??
                                                                        extraIndex
                                                                    }
                                                                    className="fw-semibold text-success"
                                                                >
                                                                    ➕ {extra.producto}

                                                                    {extra.cantidad > 1 && (
                                                                        <span className="ms-2">
                                                                            x{extra.cantidad}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                                {/* OBSERVACIONES */}

                                                {detalle.observaciones &&
                                                    detalle.observaciones.trim() !== "" && (

                                                        <div className="alert alert-warning py-2 mb-2">
                                                            📝 {detalle.observaciones}
                                                        </div>

                                                    )}

                                            </div>

                                        )
                                    )}

                                    <hr />

                                    <div className="d-flex justify-content-between">

                                        <strong>
                                            Total
                                        </strong>

                                        <strong>
                                            ₡ {pedido.total.toLocaleString()}
                                        </strong>

                                    </div>

                                    <button
                                        className="btn btn-success w-100 mt-4"
                                        onClick={() =>
                                            comenzarPedido(
                                                pedido.id
                                            )
                                        }
                                    >
                                        ▶ Comenzar
                                    </button>

                                </div>

                            </div>
                        );
                    })}

                </div>

                {/* PREPARANDO */}

                <div className="col-lg-6">

                    <h3 className="text-primary mb-4">
                        🔵 Preparando ({preparando.length})
                    </h3>

                    {preparando.map(pedido => {

                        const colores = colorTiempo(
                            pedido.fecha
                        );

                        return (
                            <div
                                key={pedido.id}
                                className={`card shadow mb-4 border-${colores.borde} ${colores.fondo}`}
                            >

                                <div className="card-header d-flex justify-content-between align-items-center">

                                    <h4 className="mb-0">

{pedido.tipoPedido === "Mesa" && (
    <>
        <span className="badge bg-primary mb-2">
            🪑 Mesa #{pedido.mesa}
        </span>
    </>
)}

{pedido.tipoPedido === "Xpress" && (
    <>
        <span className="badge bg-success mb-2">
            🛵 Xpress
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>

        {pedido.cliente?.telefono && (
            <div className="small text-muted">
                📱 {pedido.cliente.telefono}
            </div>
        )}
    </>
)}

{pedido.tipoPedido === "Llevar" && (
    <>
        <span className="badge bg-warning text-dark mb-2">
            🥡 Pasa a llevar
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>

        {pedido.cliente?.telefono && (
            <div className="small text-muted">
                📱 {pedido.cliente.telefono}
            </div>
        )}

        <div className="small text-warning-emphasis fw-semibold">
            🏪 Cliente recoge
        </div>
    </>
)}

                                    </h4>

                                    <h4 className="mb-1">
                                        Pedido #
                                        {pedido.numeroPedido
                                            .toString()
                                            .padStart(3, "0")}
                                    </h4>

                                    <span
                                        className={`badge bg-${colores.badge}`}
                                    >
                                        ⏱ {tiempoTranscurrido(
                                            pedido.fecha
                                        )} min
                                    </span>

                                </div>

                                <div className="card-body">

                                    {pedido.detalles.map(
                                        (detalle, index) => (

                                            <div
                                                key={detalle.id ?? index}
                                                className="mb-3"
                                            >

                                                <h5>
                                                    🍽 {detalle.producto}

                                                    <span className="ms-2 badge bg-secondary">
                                                        x{detalle.cantidad}
                                                    </span>
                                                </h5>

                                                {/* EXTRAS */}

                                                {detalle.extras?.length > 0 && (

                                                    <div className="ms-4 mb-2">

                                                        {detalle.extras.map(
                                                            (extra, extraIndex) => (

                                                                <div
                                                                    key={
                                                                        extra.id ??
                                                                        extraIndex
                                                                    }
                                                                    className="fw-semibold text-success"
                                                                >
                                                                    ➕ {extra.producto}

                                                                    {extra.cantidad > 1 && (
                                                                        <span className="ms-2">
                                                                            x{extra.cantidad}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                                {/* OBSERVACIONES */}

                                                {detalle.observaciones &&
                                                    detalle.observaciones.trim() !== "" && (

                                                        <div className="alert alert-warning py-2 mb-2">
                                                            📝 {detalle.observaciones}
                                                        </div>

                                                    )}

                                            </div>

                                        )
                                    )}

                                    <hr />

                                    <div className="d-flex justify-content-between">

                                        <strong>
                                            Total
                                        </strong>

                                        <strong>
                                            ₡ {pedido.total.toLocaleString()}
                                        </strong>

                                    </div>

                                    <button
                                        className="btn btn-primary w-100 mt-4"
                                        onClick={() =>
                                            marcarListo(
                                                pedido.id
                                            )
                                        }
                                    >
                                        ✅ Listo
                                    </button>

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>

        </div>
    );
}

export default Cocina;