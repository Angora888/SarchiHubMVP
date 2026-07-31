import { useEffect, useState } from "react";
import api from "../services/api";
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
<section
               className="text-white d-flex align-items-center"
               style={{
                   minHeight: "75vh",
                   backgroundImage:
                       "linear-gradient(rgba(0,0,0,.65), rgba(0,0,0,.65)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4')",
                   backgroundSize: "cover",
                   backgroundPosition: "center"
               }}
>
<div className="container text-center">
<h1 className="display-3 fw-bold mb-3">
                       Bienvenido a Sarchi Hub
</h1>
<p className="lead mb-4">
                       Encuentra los mejores restaurantes y apoya los negocios locales.
</p>
<div className="row justify-content-center">
<div className="col-lg-6">
<input
                               className="form-control form-control-lg shadow"
                               placeholder="🔍 Buscar restaurante..."
                               value={busqueda}
                               onChange={(e) => setBusqueda(e.target.value)}
                           />
</div>
</div>
</div>
</section>
<section className="container py-5">
<div className="text-center mb-5">
<h2 className="fw-bold">
                       Restaurantes Disponibles
</h2>
<p className="text-muted">
                       Explora nuestros comercios afiliados.
</p>
</div>
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
<div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                       {restaurantesFiltrados.map(restaurant => (
<RestaurantCard
                               key={restaurant.id}
                               restaurant={restaurant}
                           />
                       ))}
</div>
               )}
</section>
<Footer />
</>
   );
}
export default Home;