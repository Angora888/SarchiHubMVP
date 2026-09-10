import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function Dashboard() {
    const rol = localStorage.getItem("rol");

    const [datos, setDatos] = useState({
        restaurantes: 0,
        mesas: 0,
        productos: 0,
        pedidos: 0,
        usuarios: 0,
        categorias: 0,
        cocina: 0,
        caja: 0
    });

    const [permitirPedidosOnline, setPermitirPedidosOnline] = useState(false);
    const [guardandoPedidosOnline, setGuardandoPedidosOnline] = useState(false);
    const [configuracionCargada, setConfiguracionCargada] = useState(false);

    const {
        toast,
        showToast,
        hideToast
    } = useToast();

    useEffect(() => {
        cargarDashboard();

        if (rol === "Admin" || rol === "Cliente") {
            cargarConfiguracion();
        }

        const intervalo = setInterval(() => {
            cargarDashboard();
        }, 5000);

        return () => clearInterval(intervalo);
    }, []);

    const cargarDashboard = async () => {
        try {
            const respuesta = await api.get("/Dashboard");
            setDatos(respuesta.data);
        }
        catch (error) {
            console.error(error);
        }
    };

    const cargarConfiguracion = async () => {
        try {
            const respuesta = await api.get("/Restaurants/configuracion");

            setPermitirPedidosOnline(
                respuesta.data.permitirPedidosOnline
            );

            setConfiguracionCargada(true);
        }
        catch (error) {
            console.error(
                error.response?.data || "Error cargando configuración:",
                error
            );
        }
    };

    const cambiarPedidosOnline = async (nuevoEstado) => {
        if (guardandoPedidosOnline) {
            return;
        }

        try {
            setGuardandoPedidosOnline(true);

            await api.put(
                "/Restaurants/configuracion/pedidos-online",
                {
                    permitirPedidosOnline: nuevoEstado
                }
            );

            setPermitirPedidosOnline(nuevoEstado);

            showToast(
                nuevoEstado
                    ? "Pedidos en línea activados."
                    : "Pedidos en línea pausados.",
                "success"
            );
        }
        catch (error) {
            console.error(error);

            showToast(
                error.response?.data ||
                "No fue posible actualizar los pedidos en línea.",
                "error"
            );
        }
        finally {
            setGuardandoPedidosOnline(false);
        }
    };

    const colorCocina = (cantidad = 0) => {
        if (cantidad <= 3) {
            return "bg-success-subtle text-success";
        }

        if (cantidad <= 6) {
            return "bg-warning-subtle text-warning-emphasis";
        }

        return "bg-danger-subtle text-danger";
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-eyebrow">
                    Centro de operaciones
                </div>

                <h1 className="dashboard-title">
                    Dashboard
                </h1>

                <p className="dashboard-subtitle">
                    Controla pedidos, cocina, caja y la operación diaria desde un solo lugar.
                </p>
            </header>

            {(rol === "Admin" || rol === "Cliente") && configuracionCargada && (
                <div className="online-orders-card mb-4">
                    <div className="card-body">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                            <div className="d-flex align-items-start gap-3">
                                <div className="online-orders-icon">
                                    <i className="bi bi-globe2"></i>
                                </div>

                                <div>
                                    <div className="fw-bold mb-1">
                                        Pedidos en línea
                                    </div>

                                    <div className="text-muted small mb-2">
                                        Controla si los clientes pueden ordenar desde el menú público.
                                    </div>

                                    <span
                                        className={`online-status ${
                                            permitirPedidosOnline
                                                ? "active"
                                                : "paused"
                                        }`}
                                    >
                                        <span className="online-status-dot"></span>
                                        {permitirPedidosOnline
                                            ? "Recibiendo pedidos"
                                            : "Pedidos pausados"}
                                    </span>
                                </div>
                            </div>

                            <div className="form-check form-switch m-0">
                                <input
                                    className="form-check-input dashboard-switch"
                                    type="checkbox"
                                    role="switch"
                                    checked={permitirPedidosOnline}
                                    disabled={guardandoPedidosOnline}
                                    onChange={(e) =>
                                        cambiarPedidosOnline(e.target.checked)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <section className="dashboard-section">
                <div className="dashboard-section-heading">
                    <h2 className="dashboard-section-title">
                        Operación diaria
                    </h2>
                    <span className="dashboard-section-note">
                        Accesos rápidos
                    </span>
                </div>

                <div className="row">
                    <StatCard
                        titulo="Venta rápida"
                        icono="bi bi-lightning-charge-fill"
                        color="bg-warning-subtle text-warning-emphasis"
                        ruta="/venta-rapida"
                    />

                    <StatCard
                        titulo="Pedido Xpress"
                        icono="bi bi-telephone-fill"
                        color="bg-info-subtle text-info-emphasis"
                        ruta="/dashboard/pedido-xpress"
                    />

                    <StatCard
                        titulo="Pedidos"
                        valor={datos.pedidos}
                        icono="bi bi-receipt"
                        color="bg-orange"
                        ruta="/pedidos"
                    />

                    <StatCard
                        titulo="Cocina"
                        valor={datos.cocina}
                        icono="bi bi-fire"
                        color={colorCocina(datos.cocina)}
                        ruta="/cocina"
                    />

                    <StatCard
                        titulo="Caja"
                        valor={datos.caja}
                        icono="bi bi-cash-stack"
                        color="bg-soft-gray"
                        ruta="/caja"
                    />
                </div>
            </section>

            {(rol === "Admin" || rol === "Cliente") && (
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <h2 className="dashboard-section-title">
                            Gestión del restaurante
                        </h2>
                        <span className="dashboard-section-note">
                            Configuración y control
                        </span>
                    </div>

                    <div className="row">
                        <StatCard
                            titulo="Productos"
                            valor={datos.productos}
                            icono="bi bi-box-seam-fill"
                            color="bg-success-subtle text-success"
                            ruta="/productos"
                        />

                        <StatCard
                            titulo="Categorías"
                            valor={datos.categorias}
                            icono="bi bi-collection-fill"
                            color="bg-soft-green"
                            ruta="/categorias"
                        />

                        <StatCard
                            titulo="Mesas"
                            valor={datos.mesas}
                            icono="bi bi-grid-3x3-gap-fill"
                            color="bg-primary-subtle text-primary"
                            ruta="/mesas"
                        />

                        <StatCard
                            titulo="Clientes"
                            icono="bi bi-people-fill"
                            color="bg-soft-cyan"
                            ruta="/clientes"
                        />

                        <StatCard
                            titulo="Cierre de caja"
                            icono="bi bi-cash-coin"
                            color="bg-success-subtle text-success"
                            ruta="/cierre-caja"
                        />

                        <StatCard
                            titulo="Reportes"
                            icono="bi bi-bar-chart-line-fill"
                            color="bg-dark-subtle text-dark"
                            ruta="/reportes"
                        />
                    </div>
                </section>
            )}

            {rol === "Admin" && (
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <h2 className="dashboard-section-title">
                            Administración SaaS
                        </h2>
                        <span className="dashboard-section-note">
                            Gestión global
                        </span>
                    </div>

                    <div className="row">
                        <StatCard
                            titulo="Usuarios"
                            valor={datos.usuarios}
                            icono="bi bi-person-gear"
                            color="bg-danger-subtle text-danger"
                            ruta="/usuarios"
                        />

                        <StatCard
                            titulo="Restaurantes"
                            valor={datos.restaurantes}
                            icono="bi bi-buildings-fill"
                            color="bg-danger-subtle text-danger"
                            ruta="/restaurantes"
                        />
                    </div>
                </section>
            )}

            <AppToast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />
        </div>
    );
}

export default Dashboard;
