namespace backend.DTOs;

public class CropDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Variety { get; set; }
    public Guid? FieldId { get; set; }
    public DateTime PlantingDate { get; set; }
    public DateTime? ExpectedHarvestDate { get; set; }
    public DateTime? ActualHarvestDate { get; set; }
    public string Status { get; set; } = "Growing";
}
