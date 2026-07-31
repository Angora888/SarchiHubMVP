import { useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

function RestaurantForm() {

    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState({

        id: 0,

        name: "",

        description: "",

        phone: "",

        email: "",

        address: "",

        active: true

    });

    const [imagen, setImagen] = useState(null);

    const [preview, setPreview] = useState("");

    const [guardando, setGuardando] = useState(false);

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setRestaurant({

            ...restaurant,

            [name]: type === "checkbox" ? checked : value

        });

    };

    const seleccionarImagen = (e) => {

        const file = e.target.files[0];

        if (!file) return;

        setImagen(file);

        setPreview(URL.createObjectURL(file));

    };

    const guardar = async (e) => {

        e.preventDefault();

        try {

            setGuardando(true);

            const respuesta = await api.post(

                "/Restaurants",

                restaurant

            );

            const id = respuesta.data.id;

            if (imagen) {

                const formData = new FormData();

                formData.append("file", imagen);

                await api.post(

                    `/Restaurants/${id}/image`,

                    formData,

                    {

                        headers: {

                            "Content-Type": "multipart/form-data"

                        }

                    }

                );

            }

            alert("Restaurante guardado correctamente.");

            navigate("/restaurantes");

        }

        catch (error) {

            console.error(error);

            alert("Ocurrió un error al guardar.");

        }

        finally {

            setGuardando(false);

        }

    };

    return (
<div className="container py-4">
<div className="row justify-content-center">
<div className="col-lg-8">
<div className="card shadow">
<div className="card-header bg-success text-white">
<h3 className="mb-0">

                                Nuevo Restaurante
</h3>
</div>
<div className="card-body">
<form onSubmit={guardar}>
<div className="text-center mb-4">
<img

                                        src={

                                            preview ||

                                            "https://placehold.co/600x300?text=Restaurante"

                                        }

                                        alt="Preview"

                                        className="img-fluid rounded shadow"

                                        style={{

                                            maxHeight: "250px",

                                            objectFit: "cover"

                                        }}

                                    />
</div>
<div className="mb-3">
<label className="form-label">

                                        Imagen
</label>
<input

                                        type="file"

                                        className="form-control"

                                        accept="image/*"

                                        onChange={seleccionarImagen}

                                    />
</div>
<div className="mb-3">
<label className="form-label">

                                        Nombre
</label>
<input

                                        className="form-control"

                                        name="name"

                                        value={restaurant.name}

                                        onChange={handleChange}

                                        required

                                    />
</div>
<div className="mb-3">
<label className="form-label">

                                        Descripción
</label>
<textarea

                                        className="form-control"

                                        rows="3"

                                        name="description"

                                        value={restaurant.description}

                                        onChange={handleChange}

                                    />
</div>
 <div className="mb-3">
<label className="form-label">
                                       Teléfono
</label>
<input
                                       className="form-control"
                                       name="phone"
                                       value={restaurant.phone}
                                       onChange={handleChange}
                                       required
                                   />
</div>
<div className="mb-3">
<label className="form-label">
                                       Correo
</label>
<input
                                       type="email"
                                       className="form-control"
                                       name="email"
                                       value={restaurant.email}
                                       onChange={handleChange}
                                   />
</div>
<div className="mb-3">
<label className="form-label">
                                       Dirección
</label>
<textarea
                                       className="form-control"
                                       rows="3"
                                       name="address"
                                       value={restaurant.address}
                                       onChange={handleChange}
                                       required
                                   />
</div>
<div className="form-check mb-4">
<input
                                       className="form-check-input"
                                       type="checkbox"
                                       name="active"
                                       checked={restaurant.active}
                                       onChange={handleChange}
                                   />
<label className="form-check-label">
                                       Restaurante Activo
</label>
</div>
<div className="d-grid">
<button
                                       type="submit"
                                       className="btn btn-success btn-lg"
                                       disabled={guardando}
>
                                       {
                                           guardando
                                               ? "Guardando..."
                                               : "Guardar Restaurante"
                                       }
</button>
</div>
</form>
</div>
</div>
</div>
</div>
</div>
   );
}
export default RestaurantForm;