import { useNavigate } from "react-router-dom";
function Header() {
   const navigate = useNavigate();
   const cerrarSesion = () => {
       localStorage.removeItem("token");
       navigate("/");
   };
   return (
<header className="border-bottom bg-white shadow-sm">
<div className="container">
<div className="d-flex justify-content-between align-items-center py-3">
<div>
<h3 className="m-0 fw-bold">
                           🏡 Sarchi Hub Directorio
</h3>
</div>
<button
                       className="btn btn-outline-danger"
                       onClick={cerrarSesion}
>
                       🚪 Salir
</button>
</div>
</div>
</header>
   );
}
export default Header;