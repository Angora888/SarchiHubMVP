import axios from "axios";
import { cerrarSesion } from "./auth";
const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL,
   timeout: 30000
});
api.interceptors.request.use(config => {
   const token = localStorage.getItem("token");
   if (token) {
       config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});
api.interceptors.response.use(
   response => response,
   error => {
       if (error.response?.status === 401) {
           cerrarSesion(
               "Tu sesión expiró. Inicia sesión nuevamente."
           );
       }
       if (error.response?.status === 429) {
           const message = "Demasiadas solicitudes. Esperá unos momentos antes de intentar nuevamente.";
           error.message = message;
           error.response.data = message;
       }
       if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
           error.message = "La solicitud tardó demasiado. Si estabas creando un pedido, verificá si se registró antes de volver a enviarlo.";
       }
       // Never automatically retry a write: the server may have already committed it.
       return Promise.reject(error);
   }
);
export default api;
 