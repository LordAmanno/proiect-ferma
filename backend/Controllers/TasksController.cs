using Microsoft.AspNetCore.Mvc;
using Supabase;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController(Client supabase) : ControllerBase
{
    private readonly Client _supabase = supabase;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            await _supabase.InitializeAsync();
            var response = await _supabase.From<FarmTask>().Get();
            var dtos = response.Models.Select(x => new FarmTaskDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Status = x.Status,
                Priority = x.Priority,
                DueDate = x.DueDate,
                AssignedWorkerId = x.AssignedWorkerId
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
        var response = await _supabase.From<FarmTask>().Where(x => x.Id == id).Get();
        var task = response.Models.FirstOrDefault();

        if (task == null)
            return NotFound();

        var dto = new FarmTaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            DueDate = task.DueDate,
            AssignedWorkerId = task.AssignedWorkerId
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FarmTaskDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new FarmTask
        {
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            AssignedWorkerId = dto.AssignedWorkerId
        };
        var response = await _supabase.From<FarmTask>().Insert(model);
        var created = response.Models.First();
        var createdDto = new FarmTaskDto
        {
            Id = created.Id,
            Title = created.Title,
            Description = created.Description,
            Status = created.Status,
            Priority = created.Priority,
            DueDate = created.DueDate,
            AssignedWorkerId = created.AssignedWorkerId
        };
        return CreatedAtAction(nameof(Get), new { id = createdDto.Id }, createdDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] FarmTaskDto dto)
    {
        await _supabase.InitializeAsync();
        var model = new FarmTask
        {
            Id = id,
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            AssignedWorkerId = dto.AssignedWorkerId
        };
        var response = await _supabase.From<FarmTask>().Where(x => x.Id == id).Update(model);
        var updated = response.Models.FirstOrDefault();
        if (updated == null) return NotFound();
        var updatedDto = new FarmTaskDto
        {
            Id = updated.Id,
            Title = updated.Title,
            Description = updated.Description,
            Status = updated.Status,
            Priority = updated.Priority,
            DueDate = updated.DueDate,
            AssignedWorkerId = updated.AssignedWorkerId
        };
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _supabase.InitializeAsync();
        await _supabase.From<FarmTask>().Where(x => x.Id == id).Delete();
        return NoContent();
    }
}
