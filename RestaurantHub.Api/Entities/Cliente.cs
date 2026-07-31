using Microsoft.EntityFrameworkCore;

[Index(nameof(Telefono), IsUnique = true)]
public class Cliente
{
    public int Id { get; set; }
    public string Telefono { get; set; } = "";
    public string NombreCompleto { get; set; } = "";
    public string Direccion { get; set; } = "";
    public double? Latitud { get; set; }
    public double? Longitud { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.Now;
}