using backend.Models;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController(Supabase.Client client) : ControllerBase
{
    private readonly Supabase.Client _client = client;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            await _client.InitializeAsync();
            var response = await _client.From<InventoryItem>().Get();
            var dtos = response.Models.Select(x => new InventoryItemDto
            {
                Id = x.Id,
                ItemName = x.ItemName,
                Category = x.Category,
                Quantity = x.Quantity,
                Unit = x.Unit,
                LowStockThreshold = x.LowStockThreshold,
                UpdatedAt = x.UpdatedAt
            });
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        await _client.InitializeAsync();
        var response = await _client.From<InventoryItem>().Where(x => x.Id == id).Get();
        var item = response.Models.FirstOrDefault();
        if (item == null) return NotFound();
        var dto = new InventoryItemDto
        {
            Id = item.Id,
            ItemName = item.ItemName,
            Category = item.Category,
            Quantity = item.Quantity,
            Unit = item.Unit,
            LowStockThreshold = item.LowStockThreshold,
            UpdatedAt = item.UpdatedAt
        };
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InventoryItemDto dto)
    {
        await _client.InitializeAsync();
        var item = new InventoryItem
        {
            ItemName = dto.ItemName,
            Category = dto.Category,
            Quantity = dto.Quantity,
            Unit = dto.Unit,
            LowStockThreshold = dto.LowStockThreshold,
            UpdatedAt = DateTime.UtcNow // Set UpdatedAt on create
        };
        var response = await _client.From<InventoryItem>().Insert(item);
        var created = response.Models.First();
        var createdDto = new InventoryItemDto
        {
            Id = created.Id,
            ItemName = created.ItemName,
            Category = created.Category,
            Quantity = created.Quantity,
            Unit = created.Unit,
            LowStockThreshold = created.LowStockThreshold,
            UpdatedAt = created.UpdatedAt
        };
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] InventoryItemDto dto)
    {
        await _client.InitializeAsync();
        var item = new InventoryItem
        {
            Id = id,
            ItemName = dto.ItemName,
            Category = dto.Category,
            Quantity = dto.Quantity,
            Unit = dto.Unit,
            LowStockThreshold = dto.LowStockThreshold,
            UpdatedAt = DateTime.UtcNow // Update timestamp
        };
        var response = await _client.From<InventoryItem>().Update(item);
        var updated = response.Models.First();
        var updatedDto = new InventoryItemDto
        {
            Id = updated.Id,
            ItemName = updated.ItemName,
            Category = updated.Category,
            Quantity = updated.Quantity,
            Unit = updated.Unit,
            LowStockThreshold = updated.LowStockThreshold,
            UpdatedAt = updated.UpdatedAt
        };
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _client.InitializeAsync();
        await _client.From<InventoryItem>().Where(x => x.Id == id).Delete();
        return NoContent();
    }
}
