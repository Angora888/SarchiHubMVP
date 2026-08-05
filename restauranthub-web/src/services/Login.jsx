import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
function Login() {
   const navigate = useNavigate();
   const [correo, setCorreo] = useState("");
   const [password, setPassword] = useState("");
   const [mensaje, setMensaje] = useState("");
   useEffect(() => {
       const mensajeGuardado = sessionStorage.getItem("mensajeSesion");
       if (mensajeGuardado) {
           setMensaje(mensajeGuardado);
           sessionStorage.removeItem("mensajeSesion");
       }
   }, []);
   const iniciarSesion = async () => {
       try {
           const respuesta = await api.post("/Auth/login", {
               correo,
               password
           });
           localStorage.setItem("token", respuesta.data.token);
           localStorage.setItem("usuario", respuesta.data.usuario);
           localStorage.setItem("rol", respuesta.data.rol);
           // Ir directamente al Dashboard
           navigate("/dashboard");
       }
       catch (error) {
            setMensaje("❌ Correo o contraseña incorrectos.");
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
                               RestaurantHub
</h2>
{mensaje &&
<div className="alert alert-danger">
       {mensaje}
</div>
}
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