import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import Mesas from "../pages/Mesas";
import Productos from "../pages/Productos";
import Pedidos from "../pages/Pedidos";
import Usuarios from "../pages/Usuarios";
import Cliente from "../pages/Clientes";
import ProductoForm from "../pages/ProductoForm";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import RestaurantForm from "../pages/RestaurantForm";
import Restaurants from "../pages/Restaurants";
import ImportarProductos from "../pages/ImportarProductos";
import MenuPublico from "../pages/MenuPublico";
import PedidoCliente from "../pages/PedidoCliente";
import Cocina from "../pages/Cocina";
import Caja from "../pages/Caja";

function AppRouter() {
   return (
<BrowserRouter>
<Routes>
               {/* Públicas */}
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/menu/:codigoQr" element={<MenuPublico />}/>
<Route path="/pedido/:id" element={<PedidoCliente />}/>

               {/* Protegidas */}
<Route element={<ProtectedRoute />}>
<Route element={<MainLayout />}>
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/mesas" element={<Mesas />} />
<Route path="/productos" element={<Productos />} />
<Route path="/productos/nuevo" element={<ProductoForm />} />
<Route path="/pedidos" element={<Pedidos />} />
<Route path="/usuarios" element={<Usuarios />} />
<Route path="/clientes" element={<Cliente />} />
<Route path="/restaurantes/nuevo" element={<RestaurantForm />}/>
<Route path="/restaurantes" element={<Restaurants />}/>
<Route path="/productos/importar" element={<ImportarProductos />}/>
<Route path="/cocina" element={<Cocina />}/>
<Route path="/caja" element={<Caja />}/>

</Route>
</Route>
</Routes>
</BrowserRouter>
   );
}
export default AppRouter;