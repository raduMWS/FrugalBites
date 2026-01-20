using QRCoder;
using System.Text;

namespace FrugalBites.Services;

public interface IQRCodeService
{
    string GenerateOrderQRCode(Guid orderId, Guid userId);
    string GenerateQRCodeBase64(string data);
    bool ValidateOrderQRCode(string qrData, out Guid orderId, out Guid userId);
    (bool IsValid, Guid? OrderId, Guid? UserId) ValidateOrderQRCode(string qrCode);
}

public class QRCodeService : IQRCodeService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<QRCodeService> _logger;
    private readonly string _secretKey;

    public QRCodeService(IConfiguration configuration, ILogger<QRCodeService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _secretKey = _configuration["QRCode:SecretKey"] ?? "FrugalBites_QR_Secret_2026";
    }

    public string GenerateOrderQRCode(Guid orderId, Guid userId)
    {
        // Create secure QR data with signature
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var data = $"{orderId}|{userId}|{timestamp}";
        var signature = GenerateSignature(data);
        var qrData = $"FRUGALBITES:{data}|{signature}";
        
        return GenerateQRCodeBase64(qrData);
    }

    public string GenerateQRCodeBase64(string data)
    {
        try
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(data, QRCodeGenerator.ECCLevel.M);
            using var qrCode = new PngByteQRCode(qrCodeData);
            var qrCodeBytes = qrCode.GetGraphic(10);
            return Convert.ToBase64String(qrCodeBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code");
            throw;
        }
    }

    public bool ValidateOrderQRCode(string qrData, out Guid orderId, out Guid userId)
    {
        orderId = Guid.Empty;
        userId = Guid.Empty;

        try
        {
            if (!qrData.StartsWith("FRUGALBITES:"))
            {
                _logger.LogWarning("Invalid QR code format - missing prefix");
                return false;
            }

            var payload = qrData.Substring("FRUGALBITES:".Length);
            var parts = payload.Split('|');
            
            if (parts.Length != 4)
            {
                _logger.LogWarning("Invalid QR code format - wrong number of parts");
                return false;
            }

            var data = $"{parts[0]}|{parts[1]}|{parts[2]}";
            var providedSignature = parts[3];
            var expectedSignature = GenerateSignature(data);

            if (providedSignature != expectedSignature)
            {
                _logger.LogWarning("Invalid QR code signature");
                return false;
            }

            // Check timestamp (valid for 24 hours)
            if (!long.TryParse(parts[2], out var timestamp))
            {
                return false;
            }

            var qrTime = DateTimeOffset.FromUnixTimeSeconds(timestamp);
            if (DateTimeOffset.UtcNow - qrTime > TimeSpan.FromHours(24))
            {
                _logger.LogWarning("QR code has expired");
                return false;
            }

            orderId = Guid.Parse(parts[0]);
            userId = Guid.Parse(parts[1]);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating QR code");
            return false;
        }
    }

    private string GenerateSignature(string data)
    {
        using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToBase64String(hash).Substring(0, 16); // Shortened signature
    }

    // Tuple-based validation method for cleaner usage
    public (bool IsValid, Guid? OrderId, Guid? UserId) ValidateOrderQRCode(string qrCode)
    {
        if (ValidateOrderQRCode(qrCode, out Guid orderId, out Guid userId))
        {
            return (true, orderId, userId);
        }
        return (false, null, null);
    }
}
