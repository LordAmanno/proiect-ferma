using Microsoft.AspNetCore.Mvc;
using Supabase;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FieldsController(Client supabase) : ControllerBase
{
    private readonly Client _supabase = supabase;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            await _supabase.InitializeAsync();
            var response = await _supabase.From<Field>().Get();
            
            var dtos = response.Models.Select(x => new FieldDto
            {
                Id = x.Id,
                Name = x.Name,
                AreaHectares = x.AreaHectares,
                LocationCoordinates = x.LocationCoordinates,
                SoilType = x.SoilType,
                Status = x.Status
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
        var response = await _supabase.From<Field>().Where(x => x.Id == id).Get();
        var field = response.Models.FirstOrDefault();

        if (field == null)
            return NotFound();

        var dto = new FieldDto
        {
            Id = field.Id,
            Name = field.Name,
            AreaHectares = field.AreaHectares,
            LocationCoordinates = field.LocationCoordinates,
            SoilType = field.SoilType,
            Status = field.Status
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FieldDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new Field
        {
            // Id is auto-generated usually, but if provided... Supabase ignores it on insert if identity
            // But let's assume we pass what we have
            Name = dto.Name,
            AreaHectares = dto.AreaHectares,
            LocationCoordinates = dto.LocationCoordinates,
            SoilType = dto.SoilType,
            Status = dto.Status
        };
        
        var response = await _supabase.From<Field>().Insert(model);
        var created = response.Models.First();
        
        // Return DTO
        var createdDto = new FieldDto
        {
            Id = created.Id,
            Name = created.Name,
            AreaHectares = created.AreaHectares,
            LocationCoordinates = created.LocationCoordinates,
            SoilType = created.SoilType,
            Status = created.Status
        };
        
        return CreatedAtAction(nameof(Get), new { id = created.Id }, createdDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] FieldDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new Field
        {
            Id = id,
            Name = dto.Name,
            AreaHectares = dto.AreaHectares,
            LocationCoordinates = dto.LocationCoordinates,
            SoilType = dto.SoilType,
            Status = dto.Status
        };

        var response = await _supabase.From<Field>().Where(x => x.Id == id).Update(model);
        var updated = response.Models.FirstOrDefault();
        
        if (updated == null) return NotFound();

        var updatedDto = new FieldDto
        {
            Id = updated.Id,
            Name = updated.Name,
            AreaHectares = updated.AreaHectares,
            LocationCoordinates = updated.LocationCoordinates,
            SoilType = updated.SoilType,
            Status = updated.Status
        };
        
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _supabase.InitializeAsync();
        await _supabase.From<Field>().Where(x => x.Id == id).Delete();
        return NoContent();
    }
}
