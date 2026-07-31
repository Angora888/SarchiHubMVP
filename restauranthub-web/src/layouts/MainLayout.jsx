import { Outlet, useNavigate } from "react-router-dom";
function MainLayout() {
   const navigate = useNavigate();
   const cerrarSesion = () => {
       localStorage.removeItem("token");
       navigate("/");
   };
   return (
<div className="container-fluid">
<div className="d-flex justify-content-end p-3 border-bottom">
<button
                   className="btn btn-danger"
                   onClick={cerrarSesion}
>
                   Cerrar sesión
</button>
</div>
<div className="p-4">
<Outlet />
</div>
</div>
   );
}
export default MainLayout;