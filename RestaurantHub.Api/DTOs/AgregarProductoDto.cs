public class AgregarProductoDto
{
    public int ProductoId { get; set; }

    public int Cantidad { get; set; }

    public string? Observaciones { get; set; }

    public List<AgregarExtraDto> Extras { get; set; } = new();
}

public class AgregarExtraDto
{
    public int ProductoId { get; set; }

    public int Cantidad { get; set; } = 1;
}