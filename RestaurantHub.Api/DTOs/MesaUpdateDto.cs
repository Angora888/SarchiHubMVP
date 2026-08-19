namespace RestaurantHub.Api.DTOs;

public class MesaUpdateDto
{
    public int Number { get; set; }

    public string Status { get; set; } =
        "Disponible";
}