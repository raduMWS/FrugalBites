namespace FrugalBites.Services;

public interface IImageUploadService
{
    Task<string> UploadImageAsync(Stream imageStream, string fileName, string folder);
    Task<bool> DeleteImageAsync(string imageUrl);
    string GetImageUrl(string fileName, string folder);
}

public class ImageUploadService : IImageUploadService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ImageUploadService> _logger;
    private readonly string _uploadPath;
    private readonly string _baseUrl;

    public ImageUploadService(IConfiguration configuration, ILogger<ImageUploadService> logger, IWebHostEnvironment env)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Default to local storage, can be switched to S3/Azure Blob in production
        _uploadPath = Path.Combine(env.ContentRootPath, "uploads");
        _baseUrl = _configuration["ImageUpload:BaseUrl"] ?? "http://localhost:3000/uploads";
        
        // Ensure upload directory exists
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> UploadImageAsync(Stream imageStream, string fileName, string folder)
    {
        try
        {
            var folderPath = Path.Combine(_uploadPath, folder);
            Directory.CreateDirectory(folderPath);

            // Generate unique filename
            var extension = Path.GetExtension(fileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(folderPath, uniqueFileName);

            // Save file
            using var fileStream = new FileStream(filePath, FileMode.Create);
            await imageStream.CopyToAsync(fileStream);

            var imageUrl = $"{_baseUrl}/{folder}/{uniqueFileName}";
            _logger.LogInformation("Image uploaded successfully: {ImageUrl}", imageUrl);
            
            return imageUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image: {FileName}", fileName);
            throw;
        }
    }

    public async Task<bool> DeleteImageAsync(string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl) || !imageUrl.StartsWith(_baseUrl))
            {
                return false;
            }

            var relativePath = imageUrl.Replace(_baseUrl + "/", "");
            var filePath = Path.Combine(_uploadPath, relativePath);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation("Image deleted: {ImageUrl}", imageUrl);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image: {ImageUrl}", imageUrl);
            return false;
        }
    }

    public string GetImageUrl(string fileName, string folder)
    {
        return $"{_baseUrl}/{folder}/{fileName}";
    }
}
