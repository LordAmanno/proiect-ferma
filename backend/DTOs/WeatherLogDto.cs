namespace backend.DTOs;

public class WeatherLogDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public decimal? TemperatureC { get; set; }
    public decimal? RainfallMm { get; set; }
    public decimal? HumidityPercent { get; set; }
    public string? Notes { get; set; }
}
