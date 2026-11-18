import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
function Usuarios() {
	const [usuarios, setUsuarios] = useState([]);
	const [restaurantes, setRestaurantes] = useState([]);
	const [busqueda, setBusqueda] = useState("");
  const [resetEnCurso, setResetEnCurso] = useState(null);
  const [resultadoReset, setResultadoReset] = useState(null);
  const [errorReset, setErrorReset] = useState("");
	      const navigate = useNavigate();
	   useEffect(() => {
       cargarUsuarios();
	          cargarRestaurantes();
   }, []);
	const cargarUsuarios = async () => {
   const respuesta = await api.get("/Usuarios/admin");
   setUsuarios(respuesta.data);
}

const cargarRestaurantes = async () => {
   const respuesta = await api.get("/Restaurants");
   setRestaurantes(respuesta.data);
}

const resetearPassword = async (usuario) => {
  if (!window.confirm(`¿Restablecer la contraseña de ${usuario.nombre}? La anterior dejará de funcionar.`)) return;
  setResetEnCurso(usuario.id);
  setResultadoReset(null);
  setErrorReset("");
  try {
    const respuesta = await api.post(`/Usuarios/${usuario.id}/reset-password`);
    setResultadoReset({ nombre: usuario.nombre, password: respuesta.data.temporaryPassword });
  } catch (error) {
    setErrorReset(error.response?.status === 403 || error.response?.status === 404
      ? "No tenés permisos para restablecer este usuario."
      : "No se pudo restablecer la contraseña.");
  } finally {
    setResetEnCurso(null);
  }
};

const usuariosFiltrados =
usuarios.filter(u =>
   u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
   u.correo.toLowerCase().includes(busqueda.toLowerCase())
);

const guardarUsuario = async (usuario)=>{
   try{
       await api.put(
           `/Usuarios/${usuario.id}`,
           usuario
       );
   }catch(error){
       console.error(error);
   }
}

const cambiarValor = (id,campo,valor)=>{
   setUsuarios(prev=>
       prev.map(usuario=>
usuario.id===id
           ? {...usuario,[campo]:valor}
           : usuario
       )
   );
}

return (
<div className="container">
<div className="d-flex justify-content-between align-items-center mb-4">
<div>
<h2 className="fw-bold mb-1">
               👤 Usuarios
</h2>
<p className="text-muted mb-0">
               Administra los usuarios del sistema
</p>
</div>
<button
           className="btn btn-success"
           onClick={() => navigate("/usuarios/nuevo")}
>
<i className="bi bi-plus-circle me-2"></i>
           Nuevo Usuario
</button>
</div>
{errorReset && <div className="alert alert-danger" role="alert">{errorReset}</div>}
{resultadoReset && (
  <div className="alert alert-warning" role="status">
    <strong>Contraseña temporal de {resultadoReset.nombre}</strong>
    <p className="mb-2">Copiala ahora y compartila de forma privada. No volverá a mostrarse.</p>
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <code className="user-select-all">{resultadoReset.password}</code>
      <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => navigator.clipboard.writeText(resultadoReset.password)}>Copiar</button>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setResultadoReset(null)}>Ocultar</button>
    </div>
  </div>
)}
<div className="card shadow border-0 rounded-4">
<div className="card-body">
<input
               className="form-control mb-4"
               placeholder="🔍 Buscar usuario..."
               value={busqueda}
               onChange={(e) => setBusqueda(e.target.value)}
           />
<table className="table align-middle table-hover">
<thead>
<tr>
<th>Nombre</th>
<th>Correo</th>
<th style={{ width: "160px" }}>Rol</th>
<th style={{ width: "220px" }}>Restaurante</th>
<th style={{ width: "120px" }}>Activo</th>
<th>Contraseña</th>
</tr>
</thead>
<tbody>
                   {usuariosFiltrados.map(usuario => (
<tr key={usuario.id}>
<td>
<input
                                   className="form-control form-control-sm"
                                   value={usuario.nombre}
                                   onChange={(e) =>
                                       cambiarValor(
usuario.id,
                                           "nombre",
                                           e.target.value
                                       )
                                   }
                                   onBlur={() => guardarUsuario(usuario)}
                               />
</td>
<td>
<input
                                   className="form-control form-control-sm"
                                   value={usuario.correo}
                                   onChange={(e) =>
                                       cambiarValor(
usuario.id,
                                           "correo",
                                           e.target.value
                                       )
                                   }
                                   onBlur={() => guardarUsuario(usuario)}
                               />
</td>
<td>
<select
                                   className="form-select form-select-sm"
                                   value={usuario.rol}
                                   onChange={(e) => {
                                       cambiarValor(
usuario.id,
                                           "rol",
                                           e.target.value
                                       );
                                       guardarUsuario({
                                           ...usuario,
                                           rol: e.target.value
                                       });
                                   }}
>
<option value="Admin">
                                       Admin
</option>
<option value="Cliente">
                                       Cliente
</option>
</select>
</td>
<td>
<select
                                   className="form-select form-select-sm"
                                   value={usuario.restaurantId}
                                   onChange={(e) => {
                                       cambiarValor(
usuario.id,
                                           "restaurantId",
                                           Number(e.target.value)
                                       );
                                       guardarUsuario({
                                           ...usuario,
                                           restaurantId: Number(e.target.value)
                                       });
                                   }}
>
                                   {restaurantes.map(r => (
<option
                                           key={r.id}
                                           value={r.id}
>
                                           {r.name}
</option>
                                   ))}
</select>
</td>
<td>
<div className="form-check form-switch">
<input
                                       className="form-check-input"
                                       type="checkbox"
                                       checked={usuario.activo}
                                       onChange={(e) => {
                                           cambiarValor(
usuario.id,
                                               "activo",
                                               e.target.checked
                                           );
                                           guardarUsuario({
                                               ...usuario,
                                               activo: e.target.checked
                                           });
                                       }}
                                   />
</div>
</td>
<td>
{usuario.rol === "Cliente" && (
<button type="button" className="btn btn-sm btn-outline-warning" disabled={resetEnCurso !== null} onClick={() => resetearPassword(usuario)}>
{resetEnCurso === usuario.id ? "Generando..." : "🔐 Restablecer"}
</button>
)}
</td>
</tr>
                   ))}
</tbody>
</table>
</div>
</div>
</div>
);
}
export default Usuarios;