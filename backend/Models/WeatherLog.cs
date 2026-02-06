using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace backend.Models;

[Table("weather_logs")]
public class WeatherLog : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("date")]
    public DateTime Date { get; set; }

    [Column("temperature_c")]
    public decimal? TemperatureC { get; set; }

    [Column("rainfall_mm")]
    public decimal? RainfallMm { get; set; }

    [Column("humidity_percent")]
    public decimal? HumidityPercent { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }
}
