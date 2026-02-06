using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace backend.Models;

[Table("fields")]
public class Field : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("area_hectares")]
    public decimal AreaHectares { get; set; }

    [Column("location_coordinates")]
    public string? LocationCoordinates { get; set; }

    [Column("soil_type")]
    public string? SoilType { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Active";
}
