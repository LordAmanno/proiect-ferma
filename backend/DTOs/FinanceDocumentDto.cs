namespace backend.DTOs;

public class FinanceDocumentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
    public DateTime DocumentDate { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? PublicUrl { get; set; }
}
