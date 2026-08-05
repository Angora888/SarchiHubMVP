namespace RestaurantHub.Api.DTOs
{
    public class UsuarioUpdateDto
    {
        public string Nombre { get; set; } = "";
        public string Correo { get; set; } = "";
        public string Rol { get; set; } = "";
        public int RestaurantId { get; set; }
        public bool Activo { get; set; }
    }
}
