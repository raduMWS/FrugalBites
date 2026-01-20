namespace FrugalBites.Services;

public interface IPushNotificationService
{
    Task SendPushNotificationAsync(string userId, string title, string body, Dictionary<string, string>? data = null);
    Task SendOrderStatusUpdateAsync(string userId, string orderId, string status, string merchantName);
    Task SendNewOfferNearbyAsync(string userId, string offerName, string merchantName, decimal discountPercentage);
    Task RegisterDeviceTokenAsync(string userId, string token, string platform);
    Task UnregisterDeviceTokenAsync(string userId, string token);
}

public class PushNotificationService : IPushNotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _expoApiUrl = "https://exp.host/--/api/v2/push/send";

    public PushNotificationService(IConfiguration configuration, ILogger<PushNotificationService> logger, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task SendPushNotificationAsync(string userId, string title, string body, Dictionary<string, string>? data = null)
    {
        // In a real implementation, you would:
        // 1. Look up the user's device tokens from the database
        // 2. Send to each registered device
        // For now, we'll log the notification
        
        _logger.LogInformation("Push notification for user {UserId}: {Title} - {Body}", userId, title, body);
        
        // TODO: Implement actual push notification via Expo/FCM/APNs
        // This would involve:
        // - Getting device tokens from database
        // - Calling the appropriate push service
        await Task.CompletedTask;
    }

    public async Task SendOrderStatusUpdateAsync(string userId, string orderId, string status, string merchantName)
    {
        var (title, body) = status switch
        {
            "CONFIRMED" => ("Order Confirmed! ✅", $"Your order at {merchantName} has been confirmed."),
            "PREPARING" => ("Order Being Prepared 👨‍🍳", $"{merchantName} is preparing your order."),
            "READY" => ("Order Ready! 🎉", $"Your order at {merchantName} is ready for pickup!"),
            "PICKED_UP" => ("Order Picked Up ✓", $"Thank you for picking up your order from {merchantName}!"),
            "CANCELLED" => ("Order Cancelled ❌", $"Your order at {merchantName} has been cancelled."),
            _ => ("Order Update", $"Your order status: {status}")
        };

        await SendPushNotificationAsync(userId, title, body, new Dictionary<string, string>
        {
            { "type", "order_update" },
            { "orderId", orderId },
            { "status", status }
        });
    }

    public async Task SendNewOfferNearbyAsync(string userId, string offerName, string merchantName, decimal discountPercentage)
    {
        var title = "New Deal Nearby! 🍽️";
        var body = $"{offerName} at {merchantName} - {discountPercentage:F0}% off!";

        await SendPushNotificationAsync(userId, title, body, new Dictionary<string, string>
        {
            { "type", "new_offer" },
            { "merchantName", merchantName }
        });
    }

    public async Task RegisterDeviceTokenAsync(string userId, string token, string platform)
    {
        _logger.LogInformation("Registered device token for user {UserId} on {Platform}", userId, platform);
        // TODO: Save to database
        await Task.CompletedTask;
    }

    public async Task UnregisterDeviceTokenAsync(string userId, string token)
    {
        _logger.LogInformation("Unregistered device token for user {UserId}", userId);
        // TODO: Remove from database
        await Task.CompletedTask;
    }
}
