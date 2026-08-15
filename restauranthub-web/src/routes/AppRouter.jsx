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
import Categorias from "../pages/Categorias";
import UsuarioForm from "../pages/UsuarioForm";
import MesaForm from "../pages/MesaForm";
import MenuRestaurant from "../pages/RestaurantMenu";
import PedidoXpress from "../pages/PedidoXpress"
import CierreCaja from "../pages/CierreCaja"
import Reportes from "../pages/Reportes"

function AppRouter() {
   return (
<BrowserRouter>
<Routes>
               {/* Públicas */}
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/menu/:codigoQr" element={<MenuPublico />}/>
<Route path="/menu/restaurant/:id" element={<MenuRestaurant />}/>
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
<Route path="/restaurantes/editar/:id" element={<RestaurantForm />}/>
<Route path="/restaurantes" element={<Restaurants />}/>
<Route path="/productos/importar" element={<ImportarProductos />}/>
<Route path="/cocina" element={<Cocina />}/>
<Route path="/caja" element={<Caja />}/>
<Route path="/categorias" element={<Categorias />}/>
<Route path="/usuarios/nuevo" element={<UsuarioForm />}/>
<Route path="/mesas/nuevo" element={<MesaForm />}/>
<Route path="/dashboard/pedido-xpress" element={<PedidoXpress />} />
<Route path="/cierre-caja" element={<CierreCaja />} />
<Route path="/reportes" element={<Reportes />} />

</Route>
</Route>
</Routes>
</BrowserRouter>
   );
}
export default AppRouter;