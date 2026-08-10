import { useEffect, useState } from "react";
import api from "../services/api";
import logo from "../assets/Logosinfilas.PNG";
import NavbarPublic from "../components/NavbarPublic";
import RestaurantCard from "../components/RestaurantCard";
import Footer from "../components/Footer";
function Home() {
   const [restaurantes, setRestaurantes] = useState([]);
   const [busqueda, setBusqueda] = useState("");
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   useEffect(() => {
       cargarRestaurantes();
   }, []);
   const cargarRestaurantes = async () => {
       try {
           setLoading(true);
           setError("");
           const respuesta = await api.get("/Restaurants");
           setRestaurantes(respuesta.data);
       }
       catch (err) {
           console.error(err);
           setError("No fue posible cargar los restaurantes.");
       }
       finally {
           setLoading(false);
       }
   };
const restaurantesFiltrados = restaurantes.filter(r => {
   const name = (r.name ?? "").toLowerCase();
   const address = (r.address ?? "").toLowerCase();
   const texto = busqueda.toLowerCase();
   return (
       name.includes(texto) ||
       address.includes(texto)
   );
});
   return (
<>
<NavbarPublic />
<div
   style={{
       minHeight: "100vh",
       background:
           "linear-gradient(180deg,#f6fff8 0%,#ffffff 40%,#f9f9f9 100%)"
   }}
>

<section className="container py-4">
<div className="text-center mb-4"> 
<div className="text-center mb-4"> 

    <img
        src={logo}
        alt="Sin Filas"
        className="img-fluid"
        style={{
            width: "220px",
            maxWidth: "70%"
        }}
    />
</div>
<p className="text-muted mb-4">
           Pide desde tu mesa sin esperas.
</p>
<div className="row justify-content-center">
<div className="col-lg-6">
<input
                   className="form-control form-control-lg rounded-pill shadow-sm"
                   placeholder="🔍 Buscar restaurante..."
                   value={busqueda}
                   onChange={(e)=>setBusqueda(e.target.value)}
               />
</div>
</div>
</div>
<div
       className="d-flex justify-content-between align-items-center px-2"
>
<div>
<h4 className="fw-bold mb-0">
               🍴 Restaurantes afiliados
</h4>
<small className="text-muted">
               {restaurantes.length} disponibles
</small>
</div>
</div>
</section>
<section className="container py-5">

               {loading && (
<div className="text-center py-5">
<div className="spinner-border text-success"></div>
<p className="mt-3">
                           Cargando restaurantes...
</p>
</div>
               )}
               {!loading && error && (
<div className="alert alert-danger text-center">
<h5>{error}</h5>
<button
                           className="btn btn-dark mt-3"
                           onClick={cargarRestaurantes}
>
                           Reintentar
</button>
</div>
               )}
               {!loading && !error && restaurantesFiltrados.length === 0 && (
<div className="text-center py-5">
<h4>
                           No se encontraron restaurantes.
</h4>
</div>
               )}
               {!loading && !error && restaurantesFiltrados.length > 0 && (
<div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-xl-3">
                       {restaurantesFiltrados.map(restaurant => (
<RestaurantCard
                               key={restaurant.id}
                               restaurant={restaurant}
                           />
                       ))}
</div>
               )}
</section>
<section className="container py-5">
<div className="text-center mb-5">
<h2 className="fw-bold">
       ¿Cómo funciona?
</h2>
<p className="text-muted">
       En solo tres pasos podrás realizar tu pedido.
</p>
</div>
<div className="row text-center">
<div className="col-md-4 mb-4">
<div className="card border-0 shadow-sm h-100">
<div className="card-body">
<div className="display-4">
                       📱
</div>
<h4 className="mt-3">
                       Escanea
</h4>
<p className="text-muted">
                       Escanea el código QR desde tu mesa.
</p>
</div>
</div>
</div>
<div className="col-md-4 mb-4">
<div className="card border-0 shadow-sm h-100">
<div className="card-body">
<div className="display-4">
                       🍔
</div>
<h4 className="mt-3">
                       Ordena
</h4>
<p className="text-muted">
                       Realiza tu pedido directamente desde tu celular.
</p>
</div>
</div>
</div>
<div className="col-md-4 mb-4">
<div className="card border-0 shadow-sm h-100">
<div className="card-body">
<div className="display-4">
                       🍽️
</div>
<h4 className="mt-3">
                       Disfruta
</h4>
<p className="text-muted">
                       Nosotros nos encargamos del resto.
</p>
</div>
</div>
</div>
</div>
</section>
<section className="container py-5">
<div className="card shadow border-0">
<div className="card-body text-center">
<h2 className="fw-bold">
               👨‍💻 Antony Alfaro Salas
</h2>
<p className="text-muted mb-4">
               Creador de Sin Filas
</p>
<p className="mb-2">
               📞 <strong>6066-2375</strong>
</p>
<p className="mb-4">
               ✉️ <strong>app.sin.filas@outlook.com</strong>
</p>
<a
               href="https://wa.me/50660662375"
               className="btn btn-success btn-lg"
>
               📲 Solicitar una demostración
</a>
</div>
</div>
</section>
</div>
<Footer />
</>
   );
}
export default Home;