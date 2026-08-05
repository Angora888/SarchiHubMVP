import { useState } from "react";
import api from "../services/api";

   import { useLocation, useNavigate } from "react-router-dom";
function Login() {
   const [correo, setCorreo] = useState("");
   const navigate = useNavigate();
   const [password, setPassword] = useState("");


const location = useLocation();
const from = location.state?.from?.pathname || "/dashboard";
   const iniciarSesion = async () => {
       try {
           const respuesta = await api.post("/Auth/login", {
               correo,
               password
           });
           localStorage.setItem("token", respuesta.data.token);
		   localStorage.setItem("usuario", respuesta.data.usuario);
		   		   localStorage.setItem("rol", respuesta.data.rol);
           //alert("Bienvenido " + respuesta.data.usuario);
		   navigate(from, { replace: true });
           console.log(respuesta.data);
       }
       catch (error) {
           alert("Correo o contraseña incorrectos.");
           console.error(error);
       }
   };
   return (
<div className="container mt-5">
<div className="row justify-content-center">
<div className="col-md-5">
<div className="card shadow">
<div className="card-body">
<h2 className="mb-4 text-center">
                               Sin Filas Admin
</h2>
<input
                               className="form-control mb-3"
                               placeholder="Correo"
                               value={correo}
                               onChange={(e) => setCorreo(e.target.value)}
                           />
<input
                               type="password"
                               className="form-control mb-3"
                               placeholder="Contraseña"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                           />
<div className="d-flex gap-2">
<button
       className="btn btn-outline-secondary w-50"
       onClick={() => navigate("/")}
>
       Cancelar
</button>
<button
       className="btn btn-primary w-50"
       onClick={iniciarSesion}
>
       Iniciar sesión
</button>
</div>
</div>
</div>
</div>
</div>
</div>
   );
}
export default Login;