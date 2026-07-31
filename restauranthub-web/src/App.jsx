import AppRouter from "./routes/AppRouter";
function App() {
   return <AppRouter />;
   <Routes>
<Route path="/login" element={<Login />} />
<Route path="/clientes" element={<Cliente />} />
<Route path="/" element={<Navigate to="/clientes" replace />} />
</Routes>
}
export default App;