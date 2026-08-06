import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

function MesaForm() {

    const navigate = useNavigate();

    const [restaurantes, setRestaurantes] = useState([]);

    const [mesa, setMesa] = useState({

        number: "",

        restaurantId: "",

        activa: true

    });

    useEffect(() => {

        cargarRestaurantes();

    }, []);

    const cargarRestaurantes = async () => {

        try {

            const respuesta = await api.get("/Restaurants");

            setRestaurantes(respuesta.data);

        } catch (error) {

            console.error(error);

        }

    };

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setMesa({

            ...mesa,

            [name]: type === "checkbox"

                ? checked

                : value

        });

    };

    const guardar = async (e) => {

        e.preventDefault();

        try {

            await api.post("/Mesas", mesa);

            navigate("/mesas");

        } catch (error) {

            console.error(error);

            alert("No fue posible crear la mesa.");

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
<div className="mb-3">
<label className="form-label">

                                Número de Mesa
</label>
<input

                                type="number"

                                className="form-control"

                                name="number"

                                value={mesa.number}

                                onChange={handleChange}

                                required

                            />
</div>
<div className="mb-3">
<label className="form-label">

                                Restaurante
</label>
<select

                                className="form-select"

                                name="restaurantId"

                                value={mesa.restaurantId}

                                onChange={handleChange}

                                required
>
<option value="">

                                    Seleccione...
</option>

                                {restaurantes.map(r => (
<option

                                        key={r.id}

                                        value={r.id}
>

                                        {r.name}
</option>

                                ))}
</select>
</div>
<div className="form-check form-switch mb-4">
<input

                                className="form-check-input"

                                type="checkbox"

                                name="activa"

                                checked={mesa.activa}

                                onChange={handleChange}

                            />
<label className="form-check-label">

                                Mesa activa
</label>
</div>
<button

                            className="btn btn-success me-2"
>

                            Guardar
</button>
<button

                            type="button"

                            className="btn btn-secondary"

                            onClick={() => navigate("/mesas")}
>

                            Cancelar
</button>
</form>
</div>
</div>
</div>

    );

}

export default MesaForm;
 