import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function Productos() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
	const { toast, showToast, hideToast} = useToast();
    const [busqueda, setBusqueda] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        cargarProductos();
        cargarCategorias();
    }, []);

    const cargarProductos = async () => {
        try {
            const respuesta = await api.get("/Productos/admin");
            setProductos(respuesta.data);
        } catch (error) {
            console.error(error);
			showToast(
			   "No fue posible cargar los productos.",
			   "error"
			);
        }
    };

    const cargarCategorias = async () => {
        try {
            const respuesta = await api.get("/Categoria/admin");
            setCategorias(respuesta.data);
        } catch (error) {
            console.error(error);
			showToast(
   error.response?.data || "No fue posible cargar las categorias.",
   "error"
);
        }
    };

    const cambiarValor = (id, campo, valor) => {
        setProductos(prev =>
            prev.map(producto =>
                producto.id === id
                    ? { ...producto, [campo]: valor }
                    : producto
            )
        );
    };

    const guardarProducto = async (producto) => {
        try {
            const productoGuardar = {
                ...producto,

                categoriaId: Number(producto.categoriaId),

                categoriaExtrasId:
                    producto.categoriaExtrasId === "" ||
                    producto.categoriaExtrasId == null
                        ? null
                        : Number(producto.categoriaExtrasId),

                precio: Number(producto.precio)
            };

            await api.put(
                `/Productos/${producto.id}`,
                productoGuardar
            );

            console.log("Producto guardado");
        } catch (error) {
            console.error(error);
			
			showToast(
			    error.response?.data || "Error al guardar el producto.",
			   "error"
			);
        }
    };

    const productosFiltrados = productos.filter(producto => {
        const texto = busqueda.toLowerCase();

        return (
            producto.nombre.toLowerCase().includes(texto) ||
            (producto.descripcion ?? "")
                .toLowerCase()
                .includes(texto)
        );
    });

    return (
        <div className="container">

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        📦 Productos
                    </h2>

                    <p className="text-muted mb-0">
                        Administra el menú de tu restaurante
                    </p>
                </div>

                <button
                    className="btn btn-success"
                    onClick={() => navigate("/productos/nuevo")}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo producto
                </button>

            </div>

            <div className="card shadow border-0 rounded-4">

                <div className="card-body">

                    <input
                        className="form-control mb-4"
                        placeholder="🔍 Buscar producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />

                    <div className="table-responsive">

                        <table className="table align-middle table-hover">

                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Precio</th>

                                    <th>
                                        Categoría
                                    </th>

                                    <th>
                                        Extras
                                    </th>

                                    <th>Disponible</th>
                                </tr>
                            </thead>

                            <tbody>

                                {productosFiltrados.map(producto => (

                                    <tr
                                        key={producto.id}
                                        style={{
                                            transition: "all .25s ease",
                                            opacity: producto.disponible
                                                ? 1
                                                : .55
                                        }}
                                    >

                                        <td>
                                            <input
                                                className="form-control form-control-sm"
                                                value={producto.nombre}
                                                onChange={(e) =>
                                                    cambiarValor(
                                                        producto.id,
                                                        "nombre",
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={() =>
                                                    guardarProducto(producto)
                                                }
                                            />
                                        </td>

                                        <td>
                                            <input
                                                className="form-control form-control-sm"
                                                value={producto.descripcion ?? ""}
                                                onChange={(e) =>
                                                    cambiarValor(
                                                        producto.id,
                                                        "descripcion",
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={() =>
                                                    guardarProducto(producto)
                                                }
                                            />
                                        </td>

                                        <td style={{ width: "140px" }}>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={producto.precio}
                                                onChange={(e) =>
                                                    cambiarValor(
                                                        producto.id,
                                                        "precio",
                                                        Number(e.target.value)
                                                    )
                                                }
                                                onBlur={() =>
                                                    guardarProducto(producto)
                                                }
                                            />
                                        </td>

                                        {/* Categoría principal */}
                                        <td style={{ minWidth: "180px" }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={producto.categoriaId ?? ""}
                                                onChange={(e) => {
                                                    const categoriaId =
                                                        Number(e.target.value);

                                                    const actualizado = {
                                                        ...producto,
                                                        categoriaId
                                                    };

                                                    cambiarValor(
                                                        producto.id,
                                                        "categoriaId",
                                                        categoriaId
                                                    );

                                                    guardarProducto(actualizado);
                                                }}
                                            >
                                                {categorias.map(c => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Categoría de extras */}
                                        <td style={{ minWidth: "210px" }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={
                                                    producto.categoriaExtrasId ?? ""
                                                }
                                                onChange={(e) => {

                                                    const categoriaExtrasId =
                                                        e.target.value === ""
                                                            ? null
                                                            : Number(e.target.value);

                                                    const actualizado = {
                                                        ...producto,
                                                        categoriaExtrasId
                                                    };

                                                    cambiarValor(
                                                        producto.id,
                                                        "categoriaExtrasId",
                                                        categoriaExtrasId
                                                    );

                                                    guardarProducto(actualizado);
                                                }}
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
                                        </td>

                                        <td>
                                            <div className="form-check form-switch">

                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={producto.disponible}
                                                    onChange={(e) => {

                                                        const actualizado = {
                                                            ...producto,
                                                            disponible:
                                                                e.target.checked
                                                        };

                                                        cambiarValor(
                                                            producto.id,
                                                            "disponible",
                                                            e.target.checked
                                                        );

                                                        guardarProducto(actualizado);
                                                    }}
                                                />

                                            </div>
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

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

export default Productos;