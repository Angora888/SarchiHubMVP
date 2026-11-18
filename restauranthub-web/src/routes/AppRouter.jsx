import { lazy, Suspense } from "react";
import PageSkeleton from "../components/PageSkeleton";
import { BrowserRouter, Routes, Route } from "react-router-dom";
const Login = lazy(() => import("../pages/Login"));
const Home = lazy(() => import("../pages/Home"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Mesas = lazy(() => import("../pages/Mesas"));
const Productos = lazy(() => import("../pages/Productos"));
const Pedidos = lazy(() => import("../pages/Pedidos"));
const Usuarios = lazy(() => import("../pages/Usuarios"));
const Cliente = lazy(() => import("../pages/Clientes"));
const ProductoForm = lazy(() => import("../pages/ProductoForm"));
import MainLayout from "../layouts/MainLayout";
import PublicMenuLayout from "../layouts/PublicMenuLayout";
import ProtectedRoute from "./ProtectedRoute";
const RestaurantForm = lazy(() => import("../pages/RestaurantForm"));
const Restaurants = lazy(() => import("../pages/Restaurants"));
const ImportarProductos = lazy(() => import("../pages/ImportarProductos"));
const MenuPublico = lazy(() => import("../pages/MenuPublico"));
const PedidoCliente = lazy(() => import("../pages/PedidoCliente"));
const Cocina = lazy(() => import("../pages/Cocina"));
const Caja = lazy(() => import("../pages/Caja"));
const Categorias = lazy(() => import("../pages/Categorias"));
const UsuarioForm = lazy(() => import("../pages/UsuarioForm"));
const MesaForm = lazy(() => import("../pages/MesaForm"));
const MenuRestaurant = lazy(() => import("../pages/RestaurantMenu"));
const PedidoXpress = lazy(() => import("../pages/PedidoXpress"));
const CierreCaja = lazy(() => import("../pages/CierreCaja"));
const Reportes = lazy(() => import("../pages/Reportes"));
const VentaRapida = lazy(() => import("../pages/VentaRapida"));

function AppRouter() {
   return (
<BrowserRouter>
<Suspense fallback={<PageSkeleton variant="dashboard" />}>
<Routes>
               {/* Públicas */}
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route element={<PublicMenuLayout />}>
<Route path="/menu/:codigoQr" element={<MenuPublico />}/>
<Route path="/menu/restaurant/:publicId" element={<MenuRestaurant />}/>
</Route>
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
<Route path="/venta-rapida" element={<VentaRapida />}/>
</Route>
</Route>
</Routes>
</Suspense>
</BrowserRouter>
   );
}
export default AppRouter;