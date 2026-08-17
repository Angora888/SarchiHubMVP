import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import "../styles/dashboard.css";



function Dashboard() {
	
	const rol = localStorage.getItem("rol");
	console.log(rol);
	const [datos, setDatos] = useState({
   restaurantes: 0,
   mesas: 0,
   productos: 0,
   pedidos: 0,
   usuarios: 0
});
const [permitirPedidosOnline, setPermitirPedidosOnline] =
    useState(false);

const [guardandoPedidosOnline, setGuardandoPedidosOnline] =
    useState(false);

const [configuracionCargada, setConfiguracionCargada] =
    useState(false);
	
	
	
useEffect(() => {
    cargarDashboard();

    if (rol === "Admin" || rol === "Cliente") {
        cargarConfiguracion();
    }

    const intervalo = setInterval(() => {
        cargarDashboard();
    }, 5000);

    return () => clearInterval(intervalo);
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

const cargarConfiguracion = async () => {
    try {
        const respuesta =
            await api.get(
                "/Restaurants/configuracion"
            );

        setPermitirPedidosOnline(
            respuesta.data.permitirPedidosOnline
        );

        setConfiguracionCargada(true);
    }
    catch (error) {
        console.error(
            "Error cargando configuración:",
            error
        );
    }
};

const cambiarPedidosOnline = async (nuevoEstado) => {

    if (guardandoPedidosOnline)
        return;

    try {
        setGuardandoPedidosOnline(true);

        await api.put(
            "/Restaurants/configuracion/pedidos-online",
            {
                permitirPedidosOnline:
                    nuevoEstado
            }
        );

        setPermitirPedidosOnline(
            nuevoEstado
        );
    }
    catch (error) {
        console.error(error);

        alert(
            error.response?.data ||
            "No fue posible actualizar los pedidos en línea."
        );
    }
    finally {
        setGuardandoPedidosOnline(false);
    }
};

const colorCocina = (cantidad) => {
    if (cantidad <= 3)
        return "bg-success text-white";

    if (cantidad <= 6)
        return "bg-warning";

    return "bg-danger text-white";
};

   return (
   
   <>

<div className="container">
       {
		   <div>
<h2 className="mb-4">
               Dashboard
</h2>
{(rol === "Admin" || rol === "Cliente") && configuracionCargada && (

    <div className="card shadow-sm border-0 rounded-4 mb-4">

        <div className="card-body p-4">

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

                <div>

                    <h5 className="fw-bold mb-1">
                        🌐 Pedidos en línea
                    </h5>

                    <p className="text-muted mb-2">
                        Controla si tus clientes pueden realizar
                        pedidos desde el menú público.
                    </p>

                    {permitirPedidosOnline ? (

                        <span className="badge bg-success">
                            🟢 Recibiendo pedidos
                        </span>

                    ) : (

                        <span className="badge bg-secondary">
                            ⏸️ Pedidos pausados
                        </span>

                    )}

                </div>

                <div className="form-check form-switch">

                    <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"

                        checked={
                            permitirPedidosOnline
                        }

                        disabled={
                            guardandoPedidosOnline
                        }

                        onChange={
                            e =>
                                cambiarPedidosOnline(
                                    e.target.checked
                                )
                        }

                        style={{
                            width: "4rem",
                            height: "2rem",
                            cursor:
                                guardandoPedidosOnline
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    />

                </div>

            </div>

        </div>

    </div>

)}
<div className="row">
<StatCard
    titulo="Pedidos Xpress"
    icono="bi bi-telephone-fill"
    color="bg-info-subtle text-info-emphasis"
    ruta="/dashboard/pedido-xpress"
/>
<StatCard
   titulo="Pedidos"
   valor={datos.pedidos}
   icono="bi bi-receipt"
   color="bg-orange"
   ruta="/pedidos"
/>
<StatCard

    titulo="Cocina"
    valor={datos.cocina}
    icono="bi bi-fire"
   color={colorCocina(datos.cocina)}
    ruta="/cocina"

/>
 
<StatCard

    titulo="Caja"
    valor={datos.caja}
    icono="bi bi-cash-stack"
    color="bg-secondary text-white"
    ruta="/caja"

/>
{(rol === "Admin" || rol === "Cliente") && (
<>
<StatCard
           titulo="Categorías"
           valor={datos.categorias}
           icono="bi bi-people-fill"
           color="bg-soft-green text-white"
           ruta="/categorias"
       />
<StatCard
           titulo="Productos"
           valor={datos.productos}
           icono="bi bi-basket-fill"
           color="bg-success text-white"
           ruta="/productos"
       />
<StatCard
           titulo="Mesas"
           valor={datos.mesas}
           icono="bi bi-grid-3x3-gap-fill"
           color="bg-primary text-white"
           ruta="/mesas"
       />
<StatCard
           titulo="Cierre de Caja"
           valor="→"
           icono="bi bi-cash-coin"
           color="bg-success-subtle text-success"
           ruta="/cierre-caja"
       />
<StatCard
           titulo="Directorio"
           valor="→"
           icono="bi bi-building"
           color="bg-info text-white"
           ruta="/clientes"
       />
	   <StatCard
		   titulo={<span className="text-white"> Reportes</span>}
		   icono="bi bi-bar-chart-line-fill"
           color="bg-dark text-white"
           ruta="/reportes"
        />
</>
)}

{rol === "Admin" && (
<>
       {<StatCard
   titulo="Usuarios"
   valor={datos.usuarios}
   icono="bi bi-people-fill"
   color="bg-danger text-white"
   ruta="/usuarios"
/>}
       {<StatCard
   titulo="Restaurantes"
   valor={datos.restaurantes}
   icono="bi bi-people-fill"
   color="bg-danger text-white"
   ruta="/restaurantes"
/>}
</>
)}


</div>
</div>
	   }
</div>
</>

   );
}
export default Dashboard;