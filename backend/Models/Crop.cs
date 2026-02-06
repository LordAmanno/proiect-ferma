using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace backend.Models;

[Table("crops")]
public class Crop : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("variety")]
    public string? Variety { get; set; }

    [Column("field_id")]
    public Guid? FieldId { get; set; }

    [Column("planting_date")]
    public DateTime PlantingDate { get; set; }

    [Column("expected_harvest_date")]
    public DateTime? ExpectedHarvestDate { get; set; }

    [Column("actual_harvest_date")]
    public DateTime? ActualHarvestDate { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Growing";
}
