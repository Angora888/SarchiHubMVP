import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";



function Dashboard() {
	
	const [datos, setDatos] = useState({
   restaurantes: 0,
   mesas: 0,
   productos: 0,
   pedidos: 0,
   usuarios: 0
});
useEffect(() => {
   cargarDashboard();
}, []);
const cargarDashboard = async () => {
   try {
       const respuesta = await api.get("/Dashboard");
       setDatos(respuesta.data);
   }
   catch (error) {
       console.error(error);
   }
};

   return (
   
   <>
<Navbar />
<div className="container">
       {
		   <div>
<h2 className="mb-4">
               Dashboard
</h2>
<div className="row">
<StatCard
       titulo="Mesas"
       valor={datos.mesas}
       icono="bi bi-grid-3x3-gap-fill"
       color="bg-primary text-white"
   />
<StatCard
       titulo="Productos"
       valor={datos.productos}
       icono="bi bi-basket-fill"
       color="bg-success text-white"
   />
<StatCard
       titulo="Pedidos"
       valor={datos.pedidos}
       icono="bi bi-receipt"
       color="bg-warning"
   />
<StatCard
       titulo="Usuarios"
       valor={datos.usuarios}
       icono="bi bi-people-fill"
       color="bg-danger text-white"
   />
</div>
</div>
	   }
</div>
</>

   );
}
export default Dashboard;