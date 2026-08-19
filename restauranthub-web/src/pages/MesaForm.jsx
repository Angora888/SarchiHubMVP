import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function MesaForm() {

    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState(null);

    const {
        toast,
        showToast,
        hideToast
    } = useToast();

    // Solo necesitamos el número.
    // RestaurantId y Status los controla el backend.
    const [mesa, setMesa] = useState({
        number: ""
    });

    useEffect(() => {
        cargarRestaurant();
    }, []);

    // ==========================================
    // CARGAR RESTAURANTE DEL USUARIO
    // ==========================================

    const cargarRestaurant = async () => {

        try {

            const respuesta =
                await api.get(
                    "/Restaurants/configuracion"
                );

            setRestaurant(
                respuesta.data
            );

        }
        catch (error) {

            console.error(
                "Error cargando restaurante:",
                error
            );

            showToast(
                error.response?.data ||
                "No fue posible cargar el restaurante.",
                "error"
            );
        }
    };

    // ==========================================
    // CAMBIOS DEL FORMULARIO
    // ==========================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setMesa(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ==========================================
    // GUARDAR MESA
    // ==========================================

    const guardar = async (e) => {

        e.preventDefault();

        const numeroMesa =
            Number(mesa.number);

        if (
            !numeroMesa ||
            numeroMesa <= 0
        ) {

            showToast(
                "Ingrese un número de mesa válido.",
                "warning"
            );

            return;
        }

        try {

            // Solo enviamos lo que el usuario
            // realmente puede decidir.
            await api.post(
                "/Mesas",
                {
                    number: numeroMesa
                }
            );

            navigate("/mesas");

        }
        catch (error) {

            console.error(
                "Error creando mesa:",
                error
            );

            showToast(
                error.response?.data ||
                "No fue posible crear la mesa.",
                "error"
            );
        }
    };

    return (

        <div className="container">

            <h2 className="fw-bold mb-4">
                🍽️ Nueva Mesa
            </h2>

            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <form onSubmit={guardar}>

                        {/* NÚMERO DE MESA */}

                        <div className="mb-3">

                            <label className="form-label">
                                Número de Mesa
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                name="number"
                                min="1"
                                value={mesa.number}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        {/* RESTAURANTE */}

                        <div className="mb-3">

                            <label className="form-label">
                                Restaurante
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                value={
                                    restaurant?.name ?? ""
                                }
                                disabled
                            />

                            <div className="form-text">
                                Restaurante asociado a tu usuario.
                            </div>

                        </div>

                        {/* ESTADO INICIAL */}

                        <div className="mb-4">

                            <label className="form-label">
                                Estado inicial
                            </label>

                            <div>
                                <span className="badge bg-success">
                                    🟢 Disponible
                                </span>
                            </div>

                            <div className="form-text">
                                Las mesas nuevas se crean disponibles automáticamente.
                            </div>

                        </div>

                        {/* BOTONES */}

                        <button
                            type="submit"
                            className="btn btn-success me-2"
                            disabled={!restaurant}
                        >
                            Guardar
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                                navigate("/mesas")
                            }
                        >
                            Cancelar
                        </button>

                    </form>

                </div>

            </div>

            {/* TOAST */}

            <AppToast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

        </div>
    );
}

export default MesaForm;