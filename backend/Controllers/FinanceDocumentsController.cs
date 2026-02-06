using Microsoft.AspNetCore.Mvc;
using Supabase;
using backend.Models;
using backend.DTOs;
using System.IO;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinanceDocumentsController(Client supabase) : ControllerBase
{
    private readonly Client _supabase = supabase;
    private const string BUCKET_NAME = "finance-docs";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            await _supabase.InitializeAsync();
            
            var response = await _supabase.From<FinanceDocument>()
                .Order("document_date", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            var dtos = new List<FinanceDocumentDto>();

            foreach (var doc in response.Models)
            {
                // Get Public URL
                var publicUrl = _supabase.Storage.From(BUCKET_NAME).GetPublicUrl(doc.FilePath);

                dtos.Add(new FinanceDocumentDto
                {
                    Id = doc.Id,
                    Name = doc.Name,
                    FilePath = doc.FilePath,
                    FileType = doc.FileType,
                    FileSize = doc.FileSize,
                    DocumentDate = doc.DocumentDate,
                    UploadedAt = doc.UploadedAt,
                    PublicUrl = publicUrl
                });
            }

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] DateTime? date)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        try
        {
            await _supabase.InitializeAsync();

            // 1. Upload to Storage
            var fileExt = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExt}";
            var filePath = fileName; // Storing in root of bucket

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();

            // Ensure bucket exists (optional check, or assume it exists)
            // await _supabase.Storage.CreateBucket(BUCKET_NAME, new Supabase.Storage.BucketOptions { Public = true }); 
            // We assume bucket exists for simplicity or user created it.

            await _supabase.Storage.From(BUCKET_NAME).Upload(bytes, filePath);

            // 2. Save to DB
            var documentDate = date ?? DateTime.UtcNow;
            
            var model = new FinanceDocument
            {
                Name = file.FileName,
                FilePath = filePath,
                FileType = file.ContentType,
                FileSize = file.Length,
                DocumentDate = documentDate,
                UploadedAt = DateTime.UtcNow
            };

            var response = await _supabase.From<FinanceDocument>().Insert(model);
            var created = response.Models.First();

            var publicUrl = _supabase.Storage.From(BUCKET_NAME).GetPublicUrl(created.FilePath);

            var dto = new FinanceDocumentDto
            {
                Id = created.Id,
                Name = created.Name,
                FilePath = created.FilePath,
                FileType = created.FileType,
                FileSize = created.FileSize,
                DocumentDate = created.DocumentDate,
                UploadedAt = created.UploadedAt,
                PublicUrl = publicUrl
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _supabase.InitializeAsync();

            // 1. Get Document
            var response = await _supabase.From<FinanceDocument>().Where(x => x.Id == id).Get();
            var doc = response.Models.FirstOrDefault();

            if (doc == null)
                return NotFound();

            // 2. Delete from Storage
            await _supabase.Storage.From(BUCKET_NAME).Remove(new List<string> { doc.FilePath });

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
