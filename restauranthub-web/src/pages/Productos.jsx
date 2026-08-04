import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
function Productos() {
   const [productos, setProductos] = useState([]);
      const navigate = useNavigate();
   useEffect(() => {
       cargarProductos();
   }, []);
   const cargarProductos = async () => {
       try {
		const respuesta = await api.get("/Productos/admin");
		setProductos(respuesta.data);
		setProductosEditables(respuesta.data);
       } catch (error) {
           console.error(error);
       }
   };
const cambiarValor = (id, campo, valor) => {
   setProductos(prev =>
       prev.map(producto =>
producto.id === id
               ? { ...producto, [campo]: valor }
               : producto
       )
   );
};
const guardarProducto = async (producto) => {
   try {
       await api.put(`/Productos/${producto.id}`, producto);
       console.log("Producto guardado");
   } catch (error) {
       console.error(error);
   }
};
return (
<div className="container">
<div className="d-flex justify-content-between align-items-center mb-4">
<div>
<h2 className="fw-bold mb-1">

                    📦 Productos
</h2>
<p className="text-muted mb-0">

                    Administra el menú de tu restaurante
</p>
</div>
<button

                className="btn btn-success"

                onClick={() => navigate("/productos/nuevo")}
>
<i className="bi bi-plus-circle me-2"></i>

                Nuevo producto
</button>
</div>
<div className="card shadow border-0 rounded-4">
<div className="card-body">
<input

                    className="form-control mb-4"

                    placeholder="🔍 Buscar producto..."

                />
				<table className="table align-middle table-hover">
<thead>
<tr>
<th>Nombre</th>
<th>Descripción</th>
<th>Precio</th>
<th>Disponible</th>
<th></th>
</tr>
</thead>
<tbody>
       {productos.map(producto => (
<tr key={producto.id}>
<td>
<input
   className="form-control border-0 bg-transparent"
   value={producto.nombre}
   onChange={(e)=>
       cambiarValor(producto.id,"nombre",e.target.value)
   }
   onBlur={()=>guardarProducto(producto)}
/>
</td>
<td>
<input
   className="form-control border-0 bg-transparent"
   value={producto.descripcion}
   onChange={(e)=>
       cambiarValor(producto.id,"descripcion",e.target.value)
   }
   onBlur={()=>guardarProducto(producto)}
/>
</td>
<td style={{width:"140px"}}>
<input
   type="number"
   className="form-control"
   value={producto.precio}
   onChange={(e)=>
       cambiarValor(producto.id,"precio",Number(e.target.value))
   }
   onBlur={()=>guardarProducto(producto)}
/>
</td>
<td>
                   {producto.disponible ?
<span className="badge bg-success">
                           Disponible
</span>
                       :
<span className="badge bg-secondary">
                           Agotado
</span>
                   }
</td>
<td>
<button className="btn btn-outline-danger btn-sm">
<i className="bi bi-trash"></i>
</button>
</td>
</tr>
       ))}
</tbody>
</table>
</div>
</div>
</div>

);
 
}
export default Productos;