using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace backend.Models;

[Table("tasks")]
public class FarmTask : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Pending";

    [Column("priority")]
    public string Priority { get; set; } = "Medium";

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("assigned_worker_id")]
    public Guid? AssignedWorkerId { get; set; }
}
