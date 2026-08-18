import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function ProductoForm() {
    const navigate = useNavigate();

    const [producto, setProducto] = useState({
        nombre: "",
        descripcion: "",
        precio: 0,
        categoriaId: "",
        categoriaExtrasId: "",
        disponible: true,
        imagenUrl: ""
    });
	
	const {
   toast,
   showToast,
   hideToast
} = useToast();

    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            const respuesta = await api.get("/Categoria/admin");
            setCategorias(respuesta.data);
        }
        catch (error) {
            console.error(error);
			showToast(
   "No fue posible cargar las categorias.",
   "error"
);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setProducto({
            ...producto,
            [name]: type === "checkbox"
                ? checked
                : value
        });
    };

    const guardar = async (e) => {
        e.preventDefault();

        try {
            const productoGuardar = {
                ...producto,

                categoriaId: Number(producto.categoriaId),

                categoriaExtrasId:
                    producto.categoriaExtrasId === ""
                        ? null
                        : Number(producto.categoriaExtrasId),

                precio: Number(producto.precio)
            };

            await api.post("/Productos", productoGuardar);

            navigate("/productos");
        }
        catch (error) {
            console.error(error);

			showToast(
   "Error al guardar el producto.",
   "error"
);
        }
    };

    return (
        <div className="container">

            <h2 className="fw-bold mb-4">
                📦 Nuevo Producto
            </h2>

            <div className="card shadow border-0 rounded-4">
                <div className="card-body">

                    <form onSubmit={guardar}>

                        <div className="mb-3">
                            <label className="form-label">
                                Nombre
                            </label>

                            <input
                                className="form-control"
                                name="nombre"
                                value={producto.nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Descripción
                            </label>

                            <textarea
                                rows="3"
                                className="form-control"
                                name="descripcion"
                                value={producto.descripcion}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="row">

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Precio
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control"
                                    name="precio"
                                    value={producto.precio}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Categoría
                                </label>

                                <select
                                    className="form-select"
                                    name="categoriaId"
                                    value={producto.categoriaId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Seleccione...
                                    </option>

                                    {categorias.map(c => (
                                        <option
                                            key={c.id}
                                            value={c.id}
                                        >
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Categoría de extras
                            </label>

                            <select
                                className="form-select"
                                name="categoriaExtrasId"
                                value={producto.categoriaExtrasId}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Ninguna
                                </option>

                                {categorias.map(c => (
                                    <option
                                        key={c.id}
                                        value={c.id}
                                    >
                                        {c.name}
                                    </option>
                                ))}
                            </select>

                            <div className="form-text">
                                Seleccione una categoría únicamente si este
                                producto permite agregar extras.
                            </div>
                        </div>

                        <div className="form-check mb-4">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="disponible"
                                checked={producto.disponible}
                                onChange={handleChange}
                            />

                            <label className="form-check-label">
                                Producto disponible
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success me-2"
                        >
                            <i className="bi bi-check-circle me-2"></i>
                            Guardar
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate("/productos")}
                        >
                            <i className="bi bi-x-circle me-2"></i>
                            Cancelar
                        </button>

                    </form>

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

export default ProductoForm;