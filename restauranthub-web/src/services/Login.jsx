import { useState } from "react";
import api from "../services/api";
function Login() {
   const [correo, setCorreo] = useState("");
   const [password, setPassword] = useState("");
   const iniciarSesion = async () => {
       try {
           const respuesta = await api.post("/Auth/login", {
               correo,
               password
           });
           localStorage.setItem("token", respuesta.data.token);
           alert("Bienvenido " + respuesta.data.usuario);
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
                               RestaurantHub
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
<button
                               className="btn btn-primary w-100"
                               onClick={iniciarSesion}
>
                               Iniciar sesión
</button>
</div>
</div>
</div>
</div>
</div>
   );
}
export default Login;