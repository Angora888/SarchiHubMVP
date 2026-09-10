import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";
import "../styles/login.css";

function Login() {
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [logueando, setLogueando] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { toast, showToast, hideToast } = useToast();

    const from =
        location.state?.from?.pathname || "/dashboard";

    const iniciarSesion = async (e) => {
        e?.preventDefault();

        if (logueando) {
            return;
        }

        if (!correo.trim() || !password) {
            showToast(
                "Ingrese el correo y la contraseña.",
                "warning"
            );
            return;
        }

        try {
            setLogueando(true);

            const respuesta = await api.post(
                "/Auth/login",
                {
                    correo: correo.trim(),
                    password
                }
            );

            localStorage.setItem(
                "token",
                respuesta.data.token
            );
            localStorage.setItem(
                "usuario",
                respuesta.data.usuario
            );
            localStorage.setItem(
                "rol",
                respuesta.data.rol
            );

            navigate(from, { replace: true });
        }
        catch (error) {
            console.error(error);

            showToast(
                error.response?.data ||
                    "Correo o contraseña incorrectos.",
                "error"
            );
        }
        finally {
            setLogueando(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-decoration login-decoration-one"></div>
            <div className="login-decoration login-decoration-two"></div>

            <div className="login-shell">
                <section className="login-brand-panel">
                    <div className="login-brand-content">
                        <div className="login-logo-mark">
                            <i className="bi bi-shop"></i>
                        </div>

                        <div>
                            <span className="login-eyebrow">
                                Plataforma para restaurantes
                            </span>
                            <h1>Sin Filas</h1>
                            <p>
                                Pedidos, cocina, caja y gestión del
                                restaurante en un solo lugar.
                            </p>
                        </div>

                        <div className="login-feature-list">
                            <div>
                                <i className="bi bi-lightning-charge-fill"></i>
                                <span>Operación rápida y sencilla</span>
                            </div>
                            <div>
                                <i className="bi bi-shield-check"></i>
                                <span>Acceso seguro por usuario</span>
                            </div>
                            <div>
                                <i className="bi bi-bar-chart-line-fill"></i>
                                <span>Control y análisis del negocio</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="login-form-panel">
                    <div className="login-form-wrapper">
                        <div className="login-mobile-logo">
                            <div className="login-logo-mark">
                                <i className="bi bi-shop"></i>
                            </div>
                            <strong>Sin Filas</strong>
                        </div>

                        <div className="mb-4">
                            <span className="login-eyebrow text-dark">
                                Bienvenido
                            </span>
                            <h2 className="login-title">
                                Iniciar sesión
                            </h2>
                            <p className="login-subtitle">
                                Ingresa tus credenciales para acceder al sistema.
                            </p>
                        </div>

                        <form onSubmit={iniciarSesion}>
                            <label
                                className="login-label"
                                htmlFor="correo"
                            >
                                Correo electrónico
                            </label>

                            <div className="login-input-group">
                                <i className="bi bi-envelope"></i>
                                <input
                                    id="correo"
                                    type="email"
                                    className="login-input"
                                    placeholder="usuario@correo.com"
                                    autoComplete="email"
                                    value={correo}
                                    disabled={logueando}
                                    onChange={(e) =>
                                        setCorreo(e.target.value)
                                    }
                                />
                            </div>

                            <label
                                className="login-label mt-3"
                                htmlFor="password"
                            >
                                Contraseña
                            </label>

                            <div className="login-input-group">
                                <i className="bi bi-lock"></i>
                                <input
                                    id="password"
                                    type={
                                        mostrarPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className="login-input"
                                    placeholder="Tu contraseña"
                                    autoComplete="current-password"
                                    value={password}
                                    disabled={logueando}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />

                                <button
                                    type="button"
                                    className="login-password-toggle"
                                    aria-label={
                                        mostrarPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                    disabled={logueando}
                                    onClick={() =>
                                        setMostrarPassword(
                                            actual => !actual
                                        )
                                    }
                                >
                                    <i
                                        className={
                                            mostrarPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    ></i>
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="login-submit-btn"
                                disabled={logueando}
                            >
                                {logueando ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm"
                                            aria-hidden="true"
                                        ></span>
                                        Ingresando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-box-arrow-in-right"></i>
                                        Iniciar sesión
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="login-back-btn"
                                disabled={logueando}
                                onClick={() => navigate("/")}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Volver al inicio
                            </button>
                        </form>

                        <div className="login-footer-note">
                            <i className="bi bi-shield-lock me-2"></i>
                            Acceso exclusivo para usuarios autorizados.
                        </div>
                    </div>
                </section>
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

export default Login;
