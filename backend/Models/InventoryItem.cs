using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace backend.Models;

[Table("inventory")]
public class InventoryItem : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("item_name")]
    public string ItemName { get; set; } = string.Empty;

    [Column("category")]
    public string Category { get; set; } = string.Empty;

    [Column("quantity")]
    public decimal Quantity { get; set; }

    [Column("unit")]
    public string Unit { get; set; } = string.Empty;

    [Column("low_stock_threshold")]
    public decimal LowStockThreshold { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
