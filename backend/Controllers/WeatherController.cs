using Microsoft.AspNetCore.Mvc;
using Supabase;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherController(Client supabase) : ControllerBase
{
    private readonly Client _supabase = supabase;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await _supabase.InitializeAsync();
        var response = await _supabase.From<WeatherLog>().Get();
        var dtos = response.Models.Select(x => new WeatherLogDto
        {
            Id = x.Id,
            Date = x.Date,
            TemperatureC = x.TemperatureC,
            RainfallMm = x.RainfallMm,
            HumidityPercent = x.HumidityPercent,
            Notes = x.Notes
        });
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        await _supabase.InitializeAsync();
        var response = await _supabase.From<WeatherLog>().Where(x => x.Id == id).Get();
        var log = response.Models.FirstOrDefault();

        if (log == null)
            return NotFound();

        var dto = new WeatherLogDto
        {
            Id = log.Id,
            Date = log.Date,
            TemperatureC = log.TemperatureC,
            RainfallMm = log.RainfallMm,
            HumidityPercent = log.HumidityPercent,
            Notes = log.Notes
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] WeatherLogDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new WeatherLog
        {
            Date = dto.Date,
            TemperatureC = dto.TemperatureC,
            RainfallMm = dto.RainfallMm,
            HumidityPercent = dto.HumidityPercent,
            Notes = dto.Notes
        };
        var response = await _supabase.From<WeatherLog>().Insert(model);
        var created = response.Models.First();
        var createdDto = new WeatherLogDto
        {
            Id = created.Id,
            Date = created.Date,
            TemperatureC = created.TemperatureC,
            RainfallMm = created.RainfallMm,
            HumidityPercent = created.HumidityPercent,
            Notes = created.Notes
        };
        return CreatedAtAction(nameof(Get), new { id = created.Id }, createdDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _supabase.InitializeAsync();
        await _supabase.From<WeatherLog>().Where(x => x.Id == id).Delete();
        return NoContent();
    }
}
