using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace backend.Models;

[Table("transactions")]
public class Transaction : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("type")]
    public string Type { get; set; } = string.Empty; // Income, Expense

    [Column("category")]
    public string Category { get; set; } = string.Empty;

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("date")]
    public DateTime Date { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("related_crop_id")]
    public Guid? RelatedCropId { get; set; }
}
