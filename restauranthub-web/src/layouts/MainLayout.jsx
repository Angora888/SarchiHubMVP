import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/main-layout.css";

function MainLayout() {
    const navigate = useNavigate();
    const usuario = localStorage.getItem("usuario") || "Usuario";
    const rol = localStorage.getItem("rol") || "";
    const [menuAbierto, setMenuAbierto] = useState(false);

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("rol");
        navigate("/");
    };

    const cerrarMenu = () => setMenuAbierto(false);

    const NavItem = ({ to, icono, texto }) => (
        <NavLink
            to={to}
            onClick={cerrarMenu}
            className={({ isActive }) =>
                `app-sidebar-link ${isActive ? "active" : ""}`
            }
        >
            <i className={`bi ${icono}`}></i>
            <span>{texto}</span>
        </NavLink>
    );

    return (
        <div className="app-shell">
            <aside className={`app-sidebar ${menuAbierto ? "open" : ""}`}>
                <div className="app-brand">
                    <div className="app-brand-icon">
                        <i className="bi bi-shop-window"></i>
                    </div>
                    <div className="app-brand-text">
                        <strong>Sin Filas</strong>
                        <span>Restaurant OS</span>
                    </div>
                </div>

                <nav className="app-sidebar-nav">
                    <div className="app-nav-section">OPERACIÓN</div>
                    <NavItem to="/dashboard" icono="bi-grid-1x2-fill" texto="Dashboard" />
                    <NavItem to="/venta-rapida" icono="bi-lightning-charge-fill" texto="Venta rápida" />
                    <NavItem to="/dashboard/pedido-xpress" icono="bi-telephone-fill" texto="Pedido Xpress" />
                    <NavItem to="/pedidos" icono="bi-receipt" texto="Pedidos" />
                    <NavItem to="/cocina" icono="bi-fire" texto="Cocina" />
                    <NavItem to="/caja" icono="bi-cash-stack" texto="Caja" />

                    {(rol === "Admin" || rol === "Cliente") && (
                        <>
                            <div className="app-nav-section">GESTIÓN</div>
                            <NavItem to="/productos" icono="bi-box-seam-fill" texto="Productos" />
                            <NavItem to="/categorias" icono="bi-collection-fill" texto="Categorías" />
                            <NavItem to="/mesas" icono="bi-grid-3x3-gap-fill" texto="Mesas" />
                            <NavItem to="/clientes" icono="bi-people-fill" texto="Clientes" />
                            <NavItem to="/cierre-caja" icono="bi-cash-coin" texto="Cierre de caja" />
                            <NavItem to="/reportes" icono="bi-bar-chart-line-fill" texto="Reportes" />
                        </>
                    )}

                    {rol === "Admin" && (
                        <>
                            <div className="app-nav-section">ADMINISTRACIÓN</div>
                            <NavItem to="/usuarios" icono="bi-person-gear" texto="Usuarios" />
                            <NavItem to="/restaurantes" icono="bi-buildings-fill" texto="Restaurantes" />
                        </>
                    )}
                </nav>

                <div className="app-sidebar-footer">
                    <div className="app-user-avatar">
                        {usuario.charAt(0).toUpperCase()}
                    </div>
                    <div className="app-user-info">
                        <strong>{usuario}</strong>
                        <span>{rol || "Usuario"}</span>
                    </div>
                    <button
                        type="button"
                        className="app-logout-button"
                        onClick={cerrarSesion}
                        title="Cerrar sesión"
                    >
                        <i className="bi bi-box-arrow-right"></i>
                    </button>
                </div>
            </aside>

            {menuAbierto && (
                <button
                    type="button"
                    className="app-sidebar-backdrop"
                    onClick={cerrarMenu}
                    aria-label="Cerrar menú"
                />
            )}

            <div className="app-main">
                <header className="app-topbar">
                    <div className="d-flex align-items-center gap-3">
                        <button
                            type="button"
                            className="app-menu-button"
                            onClick={() => setMenuAbierto(true)}
                            aria-label="Abrir menú"
                        >
                            <i className="bi bi-list"></i>
                        </button>

                        <div>
                            <div className="app-topbar-title">Sin Filas</div>
                            <div className="app-topbar-subtitle">Gestión del restaurante</div>
                        </div>
                    </div>

                    <div className="app-topbar-actions">
                        <button
                            type="button"
                            className="app-home-button"
                            onClick={() => navigate("/")}
                            title="Ir al inicio"
                        >
                            <i className="bi bi-house-door"></i>
                        </button>

                        <div className="app-role-badge">
                            <i className="bi bi-person-circle"></i>
                            <span>{rol || "Usuario"}</span>
                        </div>
                    </div>
                </header>

                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
