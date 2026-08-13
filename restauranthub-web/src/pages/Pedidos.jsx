import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Pedidos() {

    const [pedidos, setPedidos] = useState([]);
	const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        cargarPedidos();
		   const intervalo = setInterval(() => {
       cargarPedidos();
   }, 3000);
   return () => clearInterval(intervalo);

    }, []);

    const cargarPedidos = async () => {

        try {

            const respuesta = await api.get("/Pedidos");

            setPedidos(respuesta.data);

        }

        catch (error) {

            console.error(error);

        }

        finally {

            setLoading(false);

        }

    };
	
const eliminarPedido = async (id) => {
   if (!window.confirm("¿Desea eliminar este pedido?"))
       return;
   try {
       await api.delete(`/Pedidos/${id}`);
       alert("Pedido eliminado correctamente.");
       //cargarPedidos();
	   navigate("/pedidos")
   }
   catch (error) {
       console.error(error);
       alert("No fue posible eliminar el pedido.");
   }
};
	
	
	const colorPrioridad = (fecha) => {
   const minutos =
       Math.floor((new Date() - new Date(fecha)) / 60000);
   if (minutos >= 20)
       return "danger";
   if (minutos >= 10)
       return "warning";
   return "success";
};
	
	const tiempoTranscurrido = (fecha) => {

    const ahora = new Date();

    const pedido = new Date(fecha);

    const minutos = Math.floor((ahora - pedido) / 60000);

    if (minutos < 1)

        return "Hace unos segundos";

    if (minutos < 60)

        return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);

    if (horas < 24)

        return `Hace ${horas} h`;

    const dias = Math.floor(horas / 24);

    return `Hace ${dias} día(s)`;

};
    const colorEstado = (estado) => {

        switch (estado) {

            case "Pendiente":

                return "warning";

            case "Preparando":

                return "primary";

            case "Listo":

                return "success";

            case "Finalizado":

                return "secondary";

            default:

                return "dark";

        }

    };

return (
<div className="container">
<h2 className="fw-bold mb-4">

            📦 Pedidos diarios
</h2>

        {

            loading ?
<div className="text-center">
<div className="spinner-border text-success"></div>
</div>

                :

                pedidos.map(pedido => (
<div

                        key={pedido.id}

                        className={`card shadow-sm border-0 mb-3 border-start border-5 border-${colorPrioridad(pedido.fecha)}`}

                        role="button"

                        onClick={() => navigate(`/pedido/${pedido.codigoQR}`)}

                        style={{

                            cursor: "pointer",

                            transition: "all .25s ease"

                        }}
>
<div className="card-body">
<div className="d-flex justify-content-between align-items-start">
<div>
<h5 className="fw-bold mb-1">

                                        📦 Pedido #{pedido.numeroPedido.toString().padStart(3, "0")}
</h5>
<div className="text-muted">

{pedido.tipoPedido === "Mesa" && (
    <>
        <span className="badge bg-primary mb-2">
            🪑 Mesa #{pedido.mesa}
        </span>
    </>
)}

{pedido.tipoPedido === "Xpress" && (
    <>
        <span className="badge bg-success mb-2">
            🛵 Xpress
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>

        {pedido.cliente?.telefono && (
            <div className="small text-muted">
                📱 {pedido.cliente.telefono}
            </div>
        )}

        {pedido.cliente?.direccion && (
            <div className="small text-muted">
                📍 {pedido.cliente.direccion}
            </div>
        )}
    </>
)}

{pedido.tipoPedido === "Llevar" && (
    <>
        <span className="badge bg-warning text-dark mb-2">
            🥡 Pasa a llevar
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>

        {pedido.cliente?.telefono && (
            <div className="small text-muted">
                📱 {pedido.cliente.telefono}
            </div>
        )}

        <div className="small text-warning-emphasis fw-semibold">
            🏪 Cliente recoge en el restaurante
        </div>
    </>
)}
</div>
<div className="text-muted">

                                        🥗 {pedido.cantidadProductos} productos
</div>
<div className="small text-secondary">

                                        🕒 {tiempoTranscurrido(pedido.fecha)}
</div>
</div>
<span className={`badge bg-${colorEstado(pedido.estado)} fs-6`}>

                                    {pedido.estado}
</span>
</div>
<div

                                className="progress mt-3"

                                style={{ height: "8px" }}
>
<div

                                    className={`progress-bar bg-${colorEstado(pedido.estado)}`}

                                    style={{

                                        width:

                                            pedido.estado === "Pendiente"

                                                ? "25%"

                                                : pedido.estado === "Preparando"

                                                ? "60%"

                                                : pedido.estado === "Listo"

                                                ? "100%"

                                                : "100%"

                                    }}

                                />
</div>
<hr />
<div className="d-flex justify-content-between align-items-center">
<strong className="fs-5">

                                    ₡ {pedido.total.toLocaleString()}
</strong>
{!["Listo", "Terminado","Preparando"].includes(pedido.estado) && (
<button
    className="btn btn-outline-danger btn-sm"
    onClick={(e) => {
        e.stopPropagation();
        eliminarPedido(pedido.id);
    }}
>
    🗑️
</button>
)}
<span className="text-success fw-semibold">

                                    Tocar para ver →
</span>

</div>
</div>
</div>

                ))

        }
</div>

);
 

}

export default Pedidos;
 