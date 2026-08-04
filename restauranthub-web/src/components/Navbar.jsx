import { useNavigate } from "react-router-dom";
function Navbar() {
   const navigate = useNavigate();
   const fecha = new Date().toLocaleString("es-CR");
   const usuario = localStorage.getItem("usuario") || "Usuario";
   const salir = () => {
       localStorage.removeItem("token");
       localStorage.removeItem("usuario");
       navigate("/");
   };
   return (
<nav className="navbar bg-white shadow-sm mb-4">
<div className="container-fluid">
<h4 className="mb-0 fw-bold">
                   🍽 Sin Filas
</h4>
<div className="d-flex align-items-center gap-3">
<span>
<div className="text-end">
<div>
       👋 Hola, <strong>{usuario}</strong>
</div>
<small className="text-muted">
       {fecha}
</small>
</div>
</span>
<button
                       className="btn btn-outline-danger btn-sm"
                       onClick={salir}
>
                       Cerrar sesión
</button>
</div>
</div>
</nav>
   );
}
export default Navbar;