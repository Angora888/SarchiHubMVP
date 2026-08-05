import axios from "axios";
import { cerrarSesion } from "./auth";
const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL
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
       return Promise.reject(error);
   }
);
export default api;
 