import { useState } from "react";
import api from "../services/api";
function ImportarProductos() {
   const [archivo, setArchivo] = useState(null);
   const [cargando, setCargando] = useState(false);
   const [mensaje, setMensaje] = useState("");
   const importar = async () => {
       if (!archivo) {
           alert("Seleccione un archivo JSON.");
           return;
       }
       try {
           setCargando(true);
           setMensaje("");
           const texto = await archivo.text();
           const productos = JSON.parse(texto);
           const respuesta = await api.post(
               "/Productos/importar",
               productos
           );
           setMensaje(respuesta.data.mensaje);
       }
       catch (error) {
           console.error(error);
           alert("No fue posible importar el archivo.");
       }
       finally {
           setCargando(false);
       }
   };
   return (
<div className="container py-5">
<div className="row justify-content-center">
<div className="col-lg-6">
<div className="card shadow">
<div className="card-header bg-success text-white">
<h3>
                               📂 Importar Productos
</h3>
</div>
<div className="card-body">
<p>
                               Seleccione un archivo JSON con los productos.
</p>
<input
                               type="file"
                               accept=".json"
                               className="form-control mb-4"
                               onChange={(e) =>
                                   setArchivo(e.target.files[0])
                               }
                           />
<button
                               className="btn btn-success w-100"
                               disabled={cargando}
                               onClick={importar}
>
                               {
                                   cargando
                                       ? "Importando..."
                                       : "Importar Productos"
                               }
</button>
                           {
                               mensaje &&
<div className="alert alert-success mt-4">
                                   {mensaje}
</div>
                           }
</div>
</div>
</div>
</div>
</div>
   );
}
export default ImportarProductos;