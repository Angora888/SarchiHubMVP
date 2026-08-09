import { Outlet, useNavigate, Link } from "react-router-dom";
function MainLayout() {
   const navigate = useNavigate();
   const usuario = localStorage.getItem("usuario");
   const cerrarSesion = () => {
       localStorage.removeItem("token");
       localStorage.removeItem("usuario");
       localStorage.removeItem("rol");
       navigate("/");
   };
   return (
<div className="container-fluid">
<div className="d-flex justify-content-between align-items-center p-3 border-bottom">
<Link
       to="/dashboard"
       className="btn btn-success"
>
<i className="bi bi-speedometer2 me-2"></i>
       Dashboard
</Link>
<div className="d-flex align-items-center gap-3">
<div className="text-end">
<div className="fw-semibold">
               👋 {usuario}
</div>
</div>
        <button
            className="btn btn-outline-danger btn-sm px-2 py-1"
            onClick={() => navigate("/")}
        >
            🏠
        </button>
        <button
            className="btn btn-outline-danger btn-sm px-2 py-1"
            onClick={cerrarSesion}
        >
            🚪
        </button>
</div>
</div>
 
<div className="p-4">
<Outlet />
</div>
</div>
   );
}
export default MainLayout;