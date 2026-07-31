import { Link } from "react-router-dom";
function RestaurantCard({ restaurant }) {
   return (
<div className="col">
<div
               className="card shadow h-100 border-0"
               style={{
                   transition: "0.3s",
                   borderRadius: "16px",
                   overflow: "hidden"
               }}
>
<img
                   src={
                       restaurant.imageUrl
                           ? `http://localhost:5281/${restaurant.imageUrl}`
                           : "https://placehold.co/600x350?text=Restaurante"
                   }
                   className="card-img-top"
                   alt={restaurant.name}
                   style={{
                       height: "220px",
                       objectFit: "cover"
                   }}
               />
<div className="card-body">
<h4 className="fw-bold mb-3">
                       {restaurant.name}
</h4>
                   {
                       restaurant.description && (
<p className="text-muted">
                               {restaurant.description}
</p>
                       )
                   }
<p className="mb-2">
                       📍 {restaurant.address}
</p>
<p className="mb-2">
                       ☎ {restaurant.phone}
</p>
                   {
                       restaurant.email && (
<p className="mb-0">
                               ✉ {restaurant.email}
</p>
                       )
                   }
</div>
<div className="card-footer bg-white border-0">
<Link
                       to={`/restaurant/${restaurant.id}`}
                       className="btn btn-success w-100 fw-bold"
                       style={{
                           borderRadius: "10px"
                       }}
>
                       🍽️ Ver Menú
</Link>
</div>
</div>
</div>
   );
}
export default RestaurantCard;