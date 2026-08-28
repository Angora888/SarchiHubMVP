import { Link, Outlet } from "react-router-dom";

function PublicMenuLayout() {
    return (
        <>
            <Link
                to="/"
                className="btn btn-sm btn-outline-secondary"
                style={{
                    position: "fixed",
                    top: "12px",
                    right: "12px",
                    zIndex: 1050,
                    backgroundColor: "white"
                }}
                aria-label="Volver al inicio"
            >
                🏠 Inicio
            </Link>

            <Outlet />
        </>
    );
}

export default PublicMenuLayout;
