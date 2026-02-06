using Microsoft.AspNetCore.Mvc;
using Supabase;
using backend.Models;
using backend.DTOs;
using backend.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // 🔒 Secure Controller
public class FinanceDocumentsController(Client supabase, FileStorageService storageService) : ControllerBase
{
    private readonly Client _supabase = supabase;
    private readonly FileStorageService _storageService = storageService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var userGuid = Guid.Parse(userId);

            // Forward the User's Bearer Token to Supabase
            // This ensures RLS policies work correctly (auth.uid() will match)
            // var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            // _supabase.Auth.SetAuth(token);

            await _supabase.InitializeAsync();
            
            // Fetch metadata from Supabase DB, filtered by User ID
            var response = await _supabase.From<FinanceDocument>()
                .Where(x => x.UserId == userGuid)
                .Order("document_date", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            var dtos = new List<FinanceDocumentDto>();

            foreach (var doc in response.Models)
            {
                // URL is now pointing to our Secure Download Endpoint
                // We do NOT expose the raw file path
                var downloadUrl = $"/api/financedocuments/download/{doc.Id}";

                dtos.Add(new FinanceDocumentDto
                {
                    Id = doc.Id,
                    Name = doc.Name,
                    FilePath = doc.FilePath, // Internal reference
                    FileType = doc.FileType,
                    FileSize = doc.FileSize,
                    DocumentDate = doc.DocumentDate,
                    UploadedAt = doc.UploadedAt,
                    PublicUrl = downloadUrl // Frontend uses this to download
                });
            }

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] GetAll: {ex.Message} \n {ex.StackTrace}"); // Add logging
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] DateTime? date)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        try
        {
            // 1. Save File to Secure Local Storage
            var savedFileName = await _storageService.SaveFileAsync(userId, file);

            // 2. Save Metadata to Supabase DB
            // Forward Token for RLS
            // var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            // _supabase.Auth.SetAuth(token);

            await _supabase.InitializeAsync();
            
            var documentDate = date ?? DateTime.UtcNow;
            
            var model = new FinanceDocument
            {
                Id = Guid.NewGuid(),
                Name = file.FileName,
                FilePath = savedFileName, // Stored as "filename.pdf"
                FileType = file.ContentType,
                FileSize = file.Length,
                DocumentDate = documentDate,
                UploadedAt = DateTime.UtcNow,
                UserId = Guid.Parse(userId) // Associate with User
            };

            var response = await _supabase.From<FinanceDocument>().Insert(model);
            var created = response.Models.First();

            var dto = new FinanceDocumentDto
            {
                Id = created.Id,
                Name = created.Name,
                FilePath = created.FilePath,
                FileType = created.FileType,
                FileSize = created.FileSize,
                DocumentDate = created.DocumentDate,
                UploadedAt = created.UploadedAt,
                PublicUrl = $"/api/financedocuments/download/{created.Id}"
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Upload: {ex.Message} \n {ex.StackTrace}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("download/{id}")]
    public async Task<IActionResult> Download(Guid id, [FromQuery] bool inline = false)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        try 
        {
            var userGuid = Guid.Parse(userId);

            // Forward Token for RLS
            // var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            // _supabase.Auth.SetAuth(token);

            await _supabase.InitializeAsync();

            // 1. Verify Ownership in DB
            var response = await _supabase.From<FinanceDocument>()
                .Where(x => x.Id == id && x.UserId == userGuid)
                .Get();
            
            var doc = response.Models.FirstOrDefault();
            if (doc == null) return NotFound("Document not found or access denied.");

            // 2. Retrieve File from Secure Storage
            var (stream, contentType, fileName) = _storageService.GetFile(userId, doc.FilePath);
            
            if (stream == null) return NotFound("File missing from server storage.");

            if (inline)
            {
                Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
                return File(stream, contentType);
            }

            return File(stream, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving file: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        try
        {
            var userGuid = Guid.Parse(userId);

            // Forward Token for RLS
            // var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            // _supabase.Auth.SetAuth(token);

            await _supabase.InitializeAsync();

            // 1. Verify Ownership
            var response = await _supabase.From<FinanceDocument>()
                .Where(x => x.Id == id && x.UserId == userGuid)
                .Get();
            
            var doc = response.Models.FirstOrDefault();
            if (doc == null) return NotFound();

            // 2. Note: We generally DON'T delete the actual file from disk immediately 
            // to prevent data loss accidents, or we could implement a soft delete.
            // For now, we will just remove the DB record as requested. 
            // Implementing secure file deletion requires careful path validation 
            // which is handled in StorageService, but let's keep it safe for now.
            
            // 3. Delete from DB
            await _supabase.From<FinanceDocument>().Where(x => x.Id == id).Delete();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
