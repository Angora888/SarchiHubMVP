function StatCard({ titulo, valor, icono, color }) {
   return (
<div className="col-md-3 mb-4">
<div className={`card stat-card border-0 shadow ${color}`}>
<div className="card-body">
<div className="d-flex justify-content-between align-items-center">
<div>
<h6 className="text-muted">
                               {titulo}
</h6>
<h2 className="fw-bold">
                               {valor}
</h2>
</div>
<i
   className={`${icono}`}
   style={{
       fontSize:"3.2rem",
       opacity:.35
   }}
></i>
</div>
</div>
</div>
</div>
   );
}
export default StatCard;