import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="bg-dark text-white mt-5 py-5">
            <div className="container text-center">
                <h4 className="fw-bold mb-2">
                    🍽️ Sin Filas
                </h4>

                <p className="text-white-50 mb-4">
                    Tu restaurante. Más rápido, más simple, más conectado.
                </p>

                <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
                    <a
                        href="tel:+50660662375"
                        className="text-white text-decoration-none"
                    >
                        <i className="bi bi-telephone me-2"></i>
                        Soporte
                    </a>

                    <a
                        href="mailto:app.sin.filas@outlook.com"
                        className="text-white text-decoration-none"
                    >
                        <i className="bi bi-envelope me-2"></i>
                        Contacto
                    </a>

                    <Link
                        to="/login"
                        className="text-white text-decoration-none"
                    >
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Iniciar sesión
                    </Link>
                </div>

                <small className="text-white-50">
                    © 2026 Sin Filas · Desarrollado en Costa Rica 🇨🇷
                </small>
            </div>
        </footer>
    );
}

export default Footer;
