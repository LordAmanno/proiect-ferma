using System.IO;

namespace backend.Services
{
    public class FileStorageService
    {
        private readonly string _baseStoragePath;

        public FileStorageService(IWebHostEnvironment env)
        {
            // Securely place storage OUTSIDE of wwwroot so it's not publicly accessible
            _baseStoragePath = Path.Combine(env.ContentRootPath, "Storage");
            
            if (!Directory.Exists(_baseStoragePath))
            {
                Directory.CreateDirectory(_baseStoragePath);
            }
        }

        public async Task<string> SaveFileAsync(string userId, IFormFile file)
        {
            // 1. Sanitize Inputs
            var safeUserId = SanitizeFileName(userId); 
            var safeFileName = SanitizeFileName(file.FileName);
            
            // 2. Create User Folder
            var userFolder = Path.Combine(_baseStoragePath, safeUserId);
            if (!Directory.Exists(userFolder))
            {
                Directory.CreateDirectory(userFolder);
            }

            // 3. Prevent overwrites by adding timestamp or uuid if needed, 
            // but for now we'll stick to original name as requested
            var filePath = Path.Combine(userFolder, safeFileName);

            // 4. Save
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return safeFileName;
        }

        public (Stream? fileStream, string contentType, string fileName) GetFile(string userId, string fileName)
        {
            var safeUserId = SanitizeFileName(userId);
            var safeFileName = SanitizeFileName(fileName);

            var filePath = Path.Combine(_baseStoragePath, safeUserId, safeFileName);

            // Security Check: Traversal Attack Prevention
            // Verify that the resolved path is still inside the user's folder
            var fullUserPath = Path.GetFullPath(Path.Combine(_baseStoragePath, safeUserId));
            var fullFilePath = Path.GetFullPath(filePath);

            if (!fullFilePath.StartsWith(fullUserPath))
            {
                throw new UnauthorizedAccessException("Invalid file path.");
            }

            if (!File.Exists(filePath))
            {
                return (null, string.Empty, string.Empty);
            }

            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            var contentType = GetContentType(filePath);
            
            return (stream, contentType, safeFileName);
        }
        
        public IEnumerable<string> ListUserFiles(string userId)
        {
             var safeUserId = SanitizeFileName(userId);
             var userFolder = Path.Combine(_baseStoragePath, safeUserId);
             
             if (!Directory.Exists(userFolder))
             {
                 return Enumerable.Empty<string>();
             }
             
             return Directory.GetFiles(userFolder).Select(Path.GetFileName).Where(x => x != null)!;
        }

        private string SanitizeFileName(string fileName)
        {
            // Remove invalid characters and path separators
            return string.Join("_", fileName.Split(Path.GetInvalidFileNameChars()));
        }

        private string GetContentType(string path)
        {
            var types = new Dictionary<string, string>
            {
                {".txt", "text/plain"},
                {".pdf", "application/pdf"},
                {".doc", "application/vnd.ms-word"},
                {".docx", "application/vnd.ms-word"},
                {".xls", "application/vnd.ms-excel"},
                {".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
                {".png", "image/png"},
                {".jpg", "image/jpeg"},
                {".jpeg", "image/jpeg"},
                {".gif", "image/gif"},
                {".csv", "text/csv"}
            };

            var ext = Path.GetExtension(path).ToLowerInvariant();
            return types.ContainsKey(ext) ? types[ext] : "application/octet-stream";
        }
    }
}
