import { Link, useNavigate } from "react-router-dom";
function NavbarPublic() {
   const navigate = useNavigate();
   const token = localStorage.getItem("token");

let nombreUsuario = "";
if (token) {
   try {
       const payload = JSON.parse(atob(token.split(".")[1]));
       console.log(payload);
       nombreUsuario =
           payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
           payload.unique_name ||
           payload.name ||
           payload.email ||
           "";
   }
   catch {
       nombreUsuario = "";
   }
}
   const cerrarSesion = () => {
       localStorage.removeItem("token");
       navigate("/");
   };
   return (
<nav className="navbar navbar-expand-lg bg-white shadow-sm">
<div className="container">
<Link
                   className="navbar-brand fw-bold"
                   to="/"
>
                   🏡 Sarchi Hub
</Link>
               {
                   token ? (
<div className="d-flex align-items-center gap-3">
<span className="fw-semibold text-success">
                               👋 {nombreUsuario}
</span>
<button
                               className="btn btn-danger"
                               onClick={cerrarSesion}
>
                               Cerrar sesión
</button>
</div>
                   ) : (
<Link
                           to="/login"
                           className="btn btn-dark"
>
                           Iniciar sesión
</Link>
                   )
               }
</div>
</nav>
   );
}
export default NavbarPublic;