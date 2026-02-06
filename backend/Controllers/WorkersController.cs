using Microsoft.AspNetCore.Mvc;
using Supabase;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkersController(Client supabase) : ControllerBase
{
    private readonly Client _supabase = supabase;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            await _supabase.InitializeAsync();
            var response = await _supabase.From<Worker>().Get();
            var dtos = response.Models.Select(x => new WorkerDto
            {
                Id = x.Id,
                Name = x.Name,
                Role = x.Role,
                HourlyRate = x.HourlyRate
            });
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        await _supabase.InitializeAsync();
        var response = await _supabase.From<Worker>().Where(x => x.Id == id).Get();
        var worker = response.Models.FirstOrDefault();

        if (worker == null)
            return NotFound();

        var dto = new WorkerDto
        {
            Id = worker.Id,
            Name = worker.Name,
            Role = worker.Role,
            HourlyRate = worker.HourlyRate
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] WorkerDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new Worker
        {
            Name = dto.Name,
            Role = dto.Role,
            HourlyRate = dto.HourlyRate
        };
        var response = await _supabase.From<Worker>().Insert(model);
        var created = response.Models.First();
        var createdDto = new WorkerDto
        {
            Id = created.Id,
            Name = created.Name,
            Role = created.Role,
            HourlyRate = created.HourlyRate
        };
        return CreatedAtAction(nameof(Get), new { id = created.Id }, createdDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] WorkerDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new Worker
        {
            Id = id,
            Name = dto.Name,
            Role = dto.Role,
            HourlyRate = dto.HourlyRate
        };
        var response = await _supabase.From<Worker>().Where(x => x.Id == id).Update(model);
        var updated = response.Models.FirstOrDefault();
        if (updated == null) return NotFound();
        var updatedDto = new WorkerDto
        {
            Id = updated.Id,
            Name = updated.Name,
            Role = updated.Role,
            HourlyRate = updated.HourlyRate
        };
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _supabase.InitializeAsync();
        await _supabase.From<Worker>().Where(x => x.Id == id).Delete();
        return NoContent();
    }
}
