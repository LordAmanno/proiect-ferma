namespace backend.DTOs;

public class WorkerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
}
