namespace backend.DTOs;

public class InventoryItemDto
{
    public Guid Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal LowStockThreshold { get; set; }
    public DateTime UpdatedAt { get; set; }
}
