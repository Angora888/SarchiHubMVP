import { useEffect } from "react";
function AppToast({
   show,
   message,
   type = "success",
   onClose
}) {
   useEffect(() => {
       if (!show)
           return;
       const timer = setTimeout(() => {
           onClose();
       }, 3500);
       return () => clearTimeout(timer);
   }, [show, onClose]);
   if (!show)
       return null;
   const color =
       type === "error"
           ? "bg-danger"
           : type === "warning"
               ? "bg-warning text-dark"
               : type === "info"
                   ? "bg-info text-dark"
                   : "bg-success";
   return (
<div
           className="position-fixed top-0 end-0 p-3"
           style={{
               zIndex: 2000
           }}
>
<div
               className={`toast show text-white ${color}`}
               role="alert"
>
<div className="d-flex">
<div className="toast-body">
                       {message}
</div>
<button
                       type="button"
                       className="btn-close btn-close-white me-2 m-auto"
                       onClick={onClose}
                   />
</div>
</div>
</div>
   );
}
export default AppToast;