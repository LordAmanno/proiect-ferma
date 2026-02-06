using Microsoft.AspNetCore.Mvc;
using Supabase;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CropsController(Client supabase) : ControllerBase
{
    private readonly Client _supabase = supabase;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            await _supabase.InitializeAsync();
            var response = await _supabase.From<Crop>().Get();
            var dtos = response.Models.Select(x => new CropDto
            {
                Id = x.Id,
                Name = x.Name,
                Variety = x.Variety,
                FieldId = x.FieldId,
                PlantingDate = x.PlantingDate,
                ExpectedHarvestDate = x.ExpectedHarvestDate,
                ActualHarvestDate = x.ActualHarvestDate,
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
        var response = await _supabase.From<Crop>().Where(x => x.Id == id).Get();
        var crop = response.Models.FirstOrDefault();

        if (crop == null)
            return NotFound();

        var dto = new CropDto
        {
            Id = crop.Id,
            Name = crop.Name,
            Variety = crop.Variety,
            FieldId = crop.FieldId,
            PlantingDate = crop.PlantingDate,
            ExpectedHarvestDate = crop.ExpectedHarvestDate,
            ActualHarvestDate = crop.ActualHarvestDate,
            Status = crop.Status
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CropDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new Crop
        {
            Name = dto.Name,
            Variety = dto.Variety,
            FieldId = dto.FieldId,
            PlantingDate = dto.PlantingDate,
            ExpectedHarvestDate = dto.ExpectedHarvestDate,
            ActualHarvestDate = dto.ActualHarvestDate,
            Status = dto.Status
        };
        var response = await _supabase.From<Crop>().Insert(model);
        var created = response.Models.First();
        var createdDto = new CropDto
        {
            Id = created.Id,
            Name = created.Name,
            Variety = created.Variety,
            FieldId = created.FieldId,
            PlantingDate = created.PlantingDate,
            ExpectedHarvestDate = created.ExpectedHarvestDate,
            ActualHarvestDate = created.ActualHarvestDate,
            Status = created.Status
        };
        return CreatedAtAction(nameof(Get), new { id = created.Id }, createdDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CropDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new Crop
        {
            Id = id,
            Name = dto.Name,
            Variety = dto.Variety,
            FieldId = dto.FieldId,
            PlantingDate = dto.PlantingDate,
            ExpectedHarvestDate = dto.ExpectedHarvestDate,
            ActualHarvestDate = dto.ActualHarvestDate,
            Status = dto.Status
        };
        var response = await _supabase.From<Crop>().Where(x => x.Id == id).Update(model);
        var updated = response.Models.FirstOrDefault();
        if (updated == null) return NotFound();
        var updatedDto = new CropDto
        {
            Id = updated.Id,
            Name = updated.Name,
            Variety = updated.Variety,
            FieldId = updated.FieldId,
            PlantingDate = updated.PlantingDate,
            ExpectedHarvestDate = updated.ExpectedHarvestDate,
            ActualHarvestDate = updated.ActualHarvestDate,
            Status = updated.Status
        };
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _supabase.InitializeAsync();
        await _supabase.From<Crop>().Where(x => x.Id == id).Delete();
        return NoContent();
    }
}
