import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

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

<div className="container">
       {
		   <div>
<h2 className="mb-4">
               Dashboard
</h2>
<div className="row">
<StatCard

    titulo="Cocina"
    valor="→"
    icono="bi bi-fire"
   color="bg-danger text-white"
    ruta="/cocina"

/>
 
<StatCard

    titulo="Caja"
    valor="→"
    icono="bi bi-cash-stack"
    color="bg-secondary text-white"
    ruta="/caja"

/>
 
<StatCard
   titulo="Mesas"
   valor={datos.mesas}
   icono="bi bi-grid-3x3-gap-fill"
   color="bg-primary text-white"
   ruta="/mesas"
/>
<StatCard
   titulo="Productos"
   valor={datos.productos}
   icono="bi bi-basket-fill"
   color="bg-success text-white"
   ruta="/productos"
/>
<StatCard
   titulo="Pedidos"
   valor={datos.pedidos}
   icono="bi bi-receipt"
   color="bg-warning"
   ruta="/pedidos"
/>
<StatCard

    titulo="Directorio"
    valor="→"
    icono="bi bi-building"
    color="bg-info text-white"
    ruta="/clientes"
/>
 
<StatCard
   titulo="Usuarios"
   valor={datos.usuarios}
   icono="bi bi-people-fill"
   color="bg-danger text-white"
   ruta="/usuarios"
/>
</div>
</div>
	   }
</div>
</>

   );
}
export default Dashboard;