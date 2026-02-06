using backend.Models;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController(Supabase.Client client) : ControllerBase
{
    private readonly Supabase.Client _client = client;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            await _client.InitializeAsync();
            var response = await _client.From<Transaction>().Get();
            var dtos = response.Models.Select(x => new TransactionDto
            {
                Id = x.Id,
                Type = x.Type,
                Category = x.Category,
                Amount = x.Amount,
                Date = x.Date,
                Description = x.Description,
                RelatedCropId = x.RelatedCropId
            });
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TransactionDto dto)
    {
        await _client.InitializeAsync();
        var model = new Transaction
        {
            Type = dto.Type,
            Category = dto.Category,
            Amount = dto.Amount,
            Date = dto.Date,
            Description = dto.Description,
            RelatedCropId = dto.RelatedCropId
        };
        var response = await _client.From<Transaction>().Insert(model);
        var created = response.Models.First();
        var createdDto = new TransactionDto
        {
            Id = created.Id,
            Type = created.Type,
            Category = created.Category,
            Amount = created.Amount,
            Date = created.Date,
            Description = created.Description,
            RelatedCropId = created.RelatedCropId
        };
        return Ok(createdDto);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        // Note: Supabase PostgREST doesn't support aggregation easily in the client yet without RPC.
        // We will fetch all and aggregate in memory for this simple dashboard, 
        // or the user should create a Postgres View/RPC.
        // For simplicity, we fetch all.
        await _client.InitializeAsync();
        var response = await _client.From<Transaction>().Get();
        var transactions = response.Models;
        
        var income = transactions.Where(t => t.Type == "Income").Sum(t => t.Amount);
        var expense = transactions.Where(t => t.Type == "Expense").Sum(t => t.Amount);
        
        return Ok(new { Income = income, Expense = expense, Net = income - expense });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _client.InitializeAsync();
        await _client.From<Transaction>().Where(x => x.Id == id).Delete();
        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] TransactionDto dto)
    {
        await _client.InitializeAsync();
        var model = new Transaction
        {
            Id = id,
            Type = dto.Type,
            Category = dto.Category,
            Amount = dto.Amount,
            Date = dto.Date,
            Description = dto.Description,
            RelatedCropId = dto.RelatedCropId
        };
        await _client.From<Transaction>().Update(model);
        return Ok(dto);
    }
}
