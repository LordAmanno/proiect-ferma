namespace backend.DTOs;

public class FieldDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal AreaHectares { get; set; }
    public string? LocationCoordinates { get; set; }
    public string? SoilType { get; set; }
    public string Status { get; set; } = "Active";
}
