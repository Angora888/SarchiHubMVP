export function cerrarSesion(mensaje = null) {
   localStorage.removeItem("token");
   localStorage.removeItem("usuario");
   localStorage.removeItem("rol");
   if (mensaje) {
       sessionStorage.setItem("mensajeSesion", mensaje);
   }
   window.location.href = "/";
}