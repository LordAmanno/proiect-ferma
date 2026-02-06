using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace backend.Models;

[Table("equipment")]
public class Equipment : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Column("status")]
    public string Status { get; set; } = "Operational";

    [Column("last_service_date")]
    public DateTime? LastServiceDate { get; set; }

    [Column("next_service_due")]
    public DateTime? NextServiceDue { get; set; }

    [Column("purchase_date")]
    public DateTime? PurchaseDate { get; set; }
}
