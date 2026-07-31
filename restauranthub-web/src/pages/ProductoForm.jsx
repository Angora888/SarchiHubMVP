import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
function ProductoForm() {
   const navigate = useNavigate();
   const [producto, setProducto] = useState({
       name: "",
       description: "",
       price: 0,
       categoryId: "",
       restaurantId: "",
       active: true
   });
   const [categorias, setCategorias] = useState([]);
   const [restaurantes, setRestaurantes] = useState([]);
   useEffect(() => {
       cargarCategorias();
       cargarRestaurantes();
   }, []);
   const cargarCategorias = async () => {
       const respuesta = await api.get("/Category");
       setCategorias(respuesta.data);
   };
   const cargarRestaurantes = async () => {
       const respuesta = await api.get("/Restaurant");
       setRestaurantes(respuesta.data);
   };
   const handleChange = (e) => {
       const { name, value, type, checked } = e.target;
       setProducto({
           ...producto,
           [name]: type === "checkbox" ? checked : value
       });
   };
   const guardar = async (e) => {
       e.preventDefault();
       await api.post("/Product", producto);
       navigate("/productos");
   };
   return (
<div className="container">
<h2 className="mb-4">
               Nuevo Producto
</h2>
           {
			   <form onSubmit={guardar}>
<div className="mb-3">
<label>Nombre</label>
<input
           className="form-control"
           name="name"
           value={producto.name}
           onChange={handleChange}
       />
</div>
<div className="mb-3">
<label>Descripción</label>
<textarea
           className="form-control"
           name="description"
           value={producto.description}
           onChange={handleChange}
       />
</div>
<div className="mb-3">
<label>Precio</label>
<input
           type="number"
           step="0.01"
           className="form-control"
           name="price"
           value={producto.price}
           onChange={handleChange}
       />
</div>
<div className="mb-3">
<label>Categoría</label>
<select
           className="form-select"
           name="categoryId"
           value={producto.categoryId}
           onChange={handleChange}
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
<div className="mb-3">
<label>Restaurante</label>
<select
           className="form-select"
           name="restaurantId"
           value={producto.restaurantId}
           onChange={handleChange}
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
<div className="form-check mb-4">
<input
           className="form-check-input"
           type="checkbox"
           name="active"
           checked={producto.active}
           onChange={handleChange}
       />
<label className="form-check-label">
           Activo
</label>
</div>
<button className="btn btn-success me-2">
       Guardar
</button>
<button
       type="button"
       className="btn btn-secondary"
       onClick={() => navigate("/productos")}
>
       Cancelar
</button>
</form>
		   }
</div>
   );
}
export default ProductoForm;