import { useEffect, useState } from "react";

import api from "../services/api";

function Caja() {

    const [pedidos, setPedidos] = useState([]);

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

            const respuesta = await api.get("/Pedidos/caja");

            setPedidos(respuesta.data);

        }

        catch (error) {

            console.error(error);

        }

        finally {

            setLoading(false);

        }

    };

    const cobrarPedido = async (id) => {

        if (!window.confirm("¿Confirmar que el cliente ya pagó?"))

            return;

        try {

            await api.put(`/Pedidos/${id}/terminar`);

            cargarPedidos();

        }

        catch (error) {

            console.error(error);

            alert("No fue posible terminar el pedido.");

        }

    };

    if (loading)

        return (
<div className="container text-center py-5">
<div className="spinner-border text-success"></div>
<h4 className="mt-3">Cargando pedidos...</h4>
</div>

        );
 return (
<div className="container-fluid py-4">
<h2 className="text-center fw-bold mb-4">

                💵 Caja
</h2>
<div className="row">

                {

                    pedidos.length === 0 && (
<div className="col-12">
<div className="alert alert-success text-center">

                                🎉 No hay pedidos pendientes de cobrar.
</div>
</div>

                    )

                }

                {

                    pedidos.map(pedido => (
<div

                            className="col-md-6 col-lg-4 mb-4"

                            key={pedido.id}
>
<div className="card shadow h-100 border-success">
<div className="card-header d-flex justify-content-between">
<h4 className="mb-0">

{pedido.mesa ? (
    <>
        <span className="badge bg-primary mb-2">
            🪑 Mesa #{pedido.mesa}
        </span>
    </>
) : (
    <>
        <span className="badge bg-success mb-2">
            📞 Xpress
        </span>

        <div className="fw-semibold">
            👤 {pedido.cliente?.nombre}
        </div>
    </>
)}
</h4>
<h4 className="mb-1">
                                       Pedido #{pedido.numeroPedido.toString().padStart(3, "0")}
</h4>
<span className="badge bg-success">

                                        LISTO
</span>
</div>
<div className="card-body">

                                    {

                                        pedido.detalles.map((detalle, index) => (
<div

                                                key={index}

                                                className="mb-3"
>
<h5>

                                                    🍽 {detalle.producto}
<span className="badge bg-secondary ms-2">

                                                        x{detalle.cantidad}
</span>
</h5>

                                                {

                                                    detalle.observaciones &&

                                                    detalle.observaciones.trim() !== "" && (
<div className="alert alert-warning py-2 mb-2">

                                                            📝 {detalle.observaciones}
</div>

                                                    )

                                                }
</div>

                                        ))

                                    }
<hr />
<div className="d-flex justify-content-between mb-3">
<strong>Total</strong>
<strong>

                                            ₡ {pedido.total}
</strong>
</div>
<button

                                        className="btn btn-success w-100"

                                        onClick={() => cobrarPedido(pedido.id)}
>

                                        💵 Cobrar
</button>
</div>
</div>
</div>

                    ))

                }
</div>
</div>

    );

}

export default Caja;
 