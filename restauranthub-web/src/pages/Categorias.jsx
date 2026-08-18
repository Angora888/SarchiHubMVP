import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppToast from "../components/AppToast";
import useToast from "../hooks/useToast";

function Categorias() {
	const [categorias, setCategorias] = useState([]);
   const [busqueda, setBusqueda] = useState("");
   const [mostrarModal, setMostrarModal] = useState(false);
   const { toast, showToast, hideToast} = useToast();
const [nuevaCategoria, setNuevaCategoria] = useState("");
	      const navigate = useNavigate();
   useEffect(() => {
       cargarCategorias();
   }, []);
   const cargarCategorias = async () => {
       try {
		const respuesta = await api.get("/Categoria/admin");
		setCategorias(respuesta.data);
       } catch (error) {
           console.error(error);
		   showToast(
			   "Error al cargar las categorias",
			   "error"
			);
       }
   };
   const guardarCategoria = async (categorias) => {
   try {
       await api.put(`/Categoria/${categorias.id}`, categorias);
       console.log("Categoria guardada");
   } catch (error) {
       console.error(error);
	   showToast(
		   "No fue posible actualizar la categoria",
		   "error"
		);
   }
};
const categoriasFiltradas =
   categorias.filter(c =>
       c.name
           .toLowerCase()
           .includes(busqueda.toLowerCase())
   );
   
   const cambiarValor = (id, valor) => {
   setCategorias(prev =>
       prev.map(c =>
c.id === id
               ? {
                   ...c,
                   name: valor
               }
               : c
       )
   );
};

const crearCategoria = async () => {
   if (nuevaCategoria.trim() === "")
       return;
   try {
       await api.post("/Categoria", {
           name: nuevaCategoria
       });
       setNuevaCategoria("");
       setMostrarModal(false);
       cargarCategorias();
   } catch (error) {
       console.error(error);
	   showToast(
		   "No fue posible crear la nueva categoria",
		   "error"
		);
   }
};
	
return (
<div className="container">
<div className="d-flex justify-content-between align-items-center mb-4">
<div>
<h2 className="fw-bold mb-1">
                   📂 Categorías
</h2>
<p className="text-muted mb-0">
                   Administra las categorías de tu restaurante
</p>
</div>
<button
   className="btn btn-success"
   onClick={() => setMostrarModal(true)}
>
<i className="bi bi-plus-circle me-2"></i>
   Nueva Categoría
</button>
</div>
<div className="card shadow border-0 rounded-4">
<div className="card-body">
<input
                   className="form-control mb-4"
                   placeholder="🔍 Buscar categoría..."
                   value={busqueda}
                   onChange={(e) => setBusqueda(e.target.value)}
               />
<table className="table align-middle table-hover">
<thead>
<tr>
<th>Nombre</th>
<th style={{ width: "170px" }}>Productos</th>
<th></th>
</tr>
</thead>
<tbody>
                       {categoriasFiltradas.map(categoria => (
<tr key={categoria.id}>
<td>
<input
                                       className="form-control form-control-sm"
                                       value={categoria.name}
                                       onChange={(e) =>
                                           cambiarValor(
categoria.id,
                                               e.target.value
                                           )
                                       }
                                       onBlur={() =>
                                           guardarCategoria(categoria)
                                       }
                                   />
</td>
<td>
<span className="badge bg-primary">
                                       {categoria.cantidadProductos} productos
</span>
</td>
<td></td>
</tr>
                       ))}
</tbody>
</table>
</div>
</div>
{
mostrarModal &&
<div
   className="modal fade show"
   style={{
       display: "block",
       background: "rgba(0,0,0,.45)"
   }}
>
<div className="modal-dialog">
<div className="modal-content">
<div className="modal-header">
<h5 className="modal-title">
                   📂 Nueva Categoría
</h5>
<button
                   className="btn-close"
                   onClick={() =>
                       setMostrarModal(false)
                   }
               />
</div>
<div className="modal-body">
<label className="form-label">
                   Nombre
</label>
<input
                   className="form-control"
                   value={nuevaCategoria}
                   onChange={(e) =>
                       setNuevaCategoria(e.target.value)
                   }
               />
</div>
<div className="modal-footer">
<button
                   className="btn btn-secondary"
                   onClick={() =>
                       setMostrarModal(false)
                   }
>
                   Cancelar
</button>
<button
                   className="btn btn-success"
                   onClick={crearCategoria}
>
                   Guardar
</button>
</div>
</div>
</div>
</div>
}
<AppToast
   show={toast.show}
   message={toast.message}
   type={toast.type}
   onClose={hideToast}
/>
</div>

);

}
export default Categorias;