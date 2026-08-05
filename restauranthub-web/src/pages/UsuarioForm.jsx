import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
function UsuarioForm() {
   const navigate = useNavigate();
   const [restaurantes, setRestaurantes] = useState([]);
   const [usuario, setUsuario] = useState({
       nombre: "",
       correo: "",
       password: "",
       rol: "Cliente",
       restaurantId: ""
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
       const { name, value } = e.target;
       setUsuario({
           ...usuario,
           [name]: value
       });
   };
   const guardar = async (e) => {
       e.preventDefault();
       try {
           await api.post("/Usuarios", usuario);
           navigate("/usuarios");
       } catch (error) {
           console.error(error);
       }
   };
   return (
<div className="container">
<h2 className="fw-bold mb-4">
               👤 Nuevo Usuario
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
                               value={usuario.nombre}
                               onChange={handleChange}
                           />
</div>
<div className="mb-3">
<label className="form-label">
                               Correo
</label>
<input
                               type="email"
                               className="form-control"
                               name="correo"
                               value={usuario.correo}
                               onChange={handleChange}
                           />
</div>
<div className="mb-3">
<label className="form-label">
                               Contraseña
</label>
<input
                               type="password"
                               className="form-control"
                               name="password"
                               value={usuario.password}
                               onChange={handleChange}
                           />
</div>
<div className="mb-3">
<label className="form-label">
                               Restaurante
</label>
<select
                               className="form-select"
                               name="restaurantId"
                               value={usuario.restaurantId}
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
<div className="mb-4">
<label className="form-label">
                               Rol
</label>
<select
                               className="form-select"
                               name="rol"
                               value={usuario.rol}
                               onChange={handleChange}
>
<option value="Cliente">
                                   Cliente
</option>
<option value="Admin">
                                   Admin
</option>
</select>
</div>
<button className="btn btn-success me-2">
                           Guardar
</button>
<button
                           type="button"
                           className="btn btn-secondary"
                           onClick={() => navigate("/usuarios")}
>
                           Cancelar
</button>
</form>
</div>
</div>
</div>
   );
}
export default UsuarioForm;