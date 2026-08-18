import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function CierreCaja() {
    const navigate = useNavigate();

    const [resumen, setResumen] = useState(null);
	const { toast, showToast, hideToast} = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarCierre();
    }, []);

    const cargarCierre = async () => {
        try {
            const respuesta =
                await api.get("/Pedidos/cierre-caja");

            setResumen(respuesta.data);
        }
        catch (error) {
            console.error(error);

			showToast(
   "No fue posible cargar el cierre de caja.",
   "error"
);
        }
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-success"></div>
            </div>
        );
    }

    if (!resumen) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning">
                    No fue posible cargar la información.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        💵 Cierre de Caja
                    </h2>

                    <p className="text-muted mb-0">
                        Resumen de ventas del día
                    </p>
                </div>

                <button
                    className="btn btn-outline-secondary"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Dashboard
                </button>

            </div>

            {/* TOTAL VENTAS */}

            <div className="card shadow border-0 rounded-4 mb-4">

                <div className="card-body text-center py-4">

                    <div className="text-muted mb-1">
                        Ventas del día
                    </div>

                    <h1 className="fw-bold text-success mb-0">
                        ₡ {resumen.totalVentas.toLocaleString()}
                    </h1>

                </div>

            </div>

            {/* RESUMEN */}

            <div className="row g-3 mb-4">

                <div className="col-md-6">

                    <div className="card shadow-sm border-0 rounded-4 h-100">

                        <div className="card-body">

                            <div className="text-muted">
                                🧾 Pedidos terminados
                            </div>

                            <h2 className="fw-bold mb-0">
                                {resumen.cantidadPedidos}
                            </h2>

                        </div>

                    </div>

                </div>

                <div className="col-md-6">

                    <div className="card shadow-sm border-0 rounded-4 h-100">

                        <div className="card-body">

                            <div className="text-muted">
                                🎟 Ticket promedio
                            </div>

                            <h2 className="fw-bold mb-0">
                                ₡ {Math.round(
                                    resumen.ticketPromedio
                                ).toLocaleString()}
                            </h2>

                        </div>

                    </div>

                </div>

            </div>

            {/* ORIGEN PEDIDOS */}

            <div className="card shadow border-0 rounded-4">

                <div className="card-header bg-dark text-white">

                    <h5 className="mb-0">
                        📊 Detalle de ventas
                    </h5>

                </div>

                <div className="card-body">

                    <div className="row g-3">

                        {/* MESA */}

                        <div className="col-md-4">

                            <div className="border rounded-4 p-4 h-100">

                                <h5>
                                    🪑 Pedidos Mesa
                                </h5>

                                <div className="text-muted">
                                    Cantidad
                                </div>

                                <h3>
                                    {resumen.mesa?.cantidad ?? 0}
                                </h3>

                                <div className="text-muted">
                                    Total
                                </div>

                                <h4 className="text-success">
                                    ₡ {(resumen.mesa?.total ?? 0)
                                        .toLocaleString()}
                                </h4>

                            </div>

                        </div>

                        {/* XPRESS */}

                        <div className="col-md-4">

                            <div className="border rounded-4 p-4 h-100">

                                <h5>
                                    🛵 Pedidos Xpress
                                </h5>

                                <div className="text-muted">
                                    Cantidad
                                </div>

                                <h3>
                                    {resumen.xpress?.cantidad ?? 0}
                                </h3>

                                <div className="text-muted">
                                    Total
                                </div>

                                <h4 className="text-success">
                                    ₡ {(resumen.xpress?.total ?? 0)
                                        .toLocaleString()}
                                </h4>

                            </div>

                        </div>

                        {/* LLEVAR */}

                        <div className="col-md-4">

                            <div className="border rounded-4 p-4 h-100">

                                <h5>
                                    🥡 Pasa a llevar
                                </h5>

                                <div className="text-muted">
                                    Cantidad
                                </div>

                                <h3>
                                    {resumen.llevar?.cantidad ?? 0}
                                </h3>

                                <div className="text-muted">
                                    Total
                                </div>

                                <h4 className="text-success">
                                    ₡ {(resumen.llevar?.total ?? 0)
                                        .toLocaleString()}
                                </h4>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
<AppToast
   show={toast.show}
   message={toast.message}
   type={toast.type}
   onClose={hideToast}
/>
        </div>
    );
}

export default CierreCaja;