using SendGrid;
using SendGrid.Helpers.Mail;

namespace FrugalBites.Services;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string firstName, string verificationCode);
    Task SendPasswordResetAsync(string email, string firstName, string resetCode);
    Task SendOrderConfirmationAsync(string email, string firstName, string orderNumber, string foodName, decimal totalPrice, DateTime pickupTime);
    Task SendOrderReadyAsync(string email, string firstName, string orderNumber, string merchantName);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly SendGridClient _client;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        var apiKey = _configuration["SendGrid:ApiKey"] ?? throw new InvalidOperationException("SendGrid API key not configured");
        _client = new SendGridClient(apiKey);
        _fromEmail = _configuration["SendGrid:FromEmail"] ?? "noreply@frugalbites.com";
        _fromName = _configuration["SendGrid:FromName"] ?? "FrugalBites";
    }

    public async Task SendEmailVerificationAsync(string email, string firstName, string verificationCode)
    {
        var subject = "Verify your FrugalBites account";
        var htmlContent = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;'>
                    <h1 style='color: white; margin: 0;'>🍽️ FrugalBites</h1>
                </div>
                <div style='padding: 30px; background: #f9fafb;'>
                    <h2 style='color: #1f2937;'>Welcome, {firstName}! 👋</h2>
                    <p style='color: #4b5563; font-size: 16px;'>
                        Thanks for signing up for FrugalBites! Please verify your email address by entering the code below:
                    </p>
                    <div style='background: white; border: 2px dashed #10B981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10B981;'>{verificationCode}</span>
                    </div>
                    <p style='color: #6b7280; font-size: 14px;'>
                        This code expires in 15 minutes. If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
                <div style='background: #1f2937; padding: 20px; text-align: center;'>
                    <p style='color: #9ca3af; margin: 0; font-size: 12px;'>
                        © 2026 FrugalBites. Save food, save money! 🌱
                    </p>
                </div>
            </div>";

        await SendEmailAsync(email, subject, htmlContent);
    }

    public async Task SendPasswordResetAsync(string email, string firstName, string resetCode)
    {
        var subject = "Reset your FrugalBites password";
        var htmlContent = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;'>
                    <h1 style='color: white; margin: 0;'>🍽️ FrugalBites</h1>
                </div>
                <div style='padding: 30px; background: #f9fafb;'>
                    <h2 style='color: #1f2937;'>Password Reset Request</h2>
                    <p style='color: #4b5563; font-size: 16px;'>
                        Hi {firstName}, we received a request to reset your password. Use the code below:
                    </p>
                    <div style='background: white; border: 2px dashed #EF4444; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #EF4444;'>{resetCode}</span>
                    </div>
                    <p style='color: #6b7280; font-size: 14px;'>
                        This code expires in 15 minutes. If you didn't request a password reset, please ignore this email or contact support.
                    </p>
                </div>
                <div style='background: #1f2937; padding: 20px; text-align: center;'>
                    <p style='color: #9ca3af; margin: 0; font-size: 12px;'>
                        © 2026 FrugalBites. Save food, save money! 🌱
                    </p>
                </div>
            </div>";

        await SendEmailAsync(email, subject, htmlContent);
    }

    public async Task SendOrderConfirmationAsync(string email, string firstName, string orderNumber, string foodName, decimal totalPrice, DateTime pickupTime)
    {
        var subject = $"Order Confirmed - {orderNumber}";
        var htmlContent = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;'>
                    <h1 style='color: white; margin: 0;'>🍽️ FrugalBites</h1>
                </div>
                <div style='padding: 30px; background: #f9fafb;'>
                    <h2 style='color: #1f2937;'>Order Confirmed! ✅</h2>
                    <p style='color: #4b5563; font-size: 16px;'>
                        Great news, {firstName}! Your order has been confirmed.
                    </p>
                    <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;'>
                        <p style='margin: 5px 0;'><strong>Order:</strong> {orderNumber}</p>
                        <p style='margin: 5px 0;'><strong>Item:</strong> {foodName}</p>
                        <p style='margin: 5px 0;'><strong>Total:</strong> {totalPrice:F2} RON</p>
                        <p style='margin: 5px 0;'><strong>Pickup:</strong> {pickupTime:MMM dd, yyyy h:mm tt}</p>
                    </div>
                    <p style='color: #6b7280; font-size: 14px;'>
                        Show your QR code at the store to pick up your order. Don't forget to be on time!
                    </p>
                </div>
                <div style='background: #1f2937; padding: 20px; text-align: center;'>
                    <p style='color: #9ca3af; margin: 0; font-size: 12px;'>
                        © 2026 FrugalBites. Save food, save money! 🌱
                    </p>
                </div>
            </div>";

        await SendEmailAsync(email, subject, htmlContent);
    }

    public async Task SendOrderReadyAsync(string email, string firstName, string orderNumber, string merchantName)
    {
        var subject = $"Your order is ready for pickup! - {orderNumber}";
        var htmlContent = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;'>
                    <h1 style='color: white; margin: 0;'>🍽️ FrugalBites</h1>
                </div>
                <div style='padding: 30px; background: #f9fafb;'>
                    <h2 style='color: #1f2937;'>Your Order is Ready! 🎉</h2>
                    <p style='color: #4b5563; font-size: 16px;'>
                        Hey {firstName}, your order #{orderNumber} is ready for pickup at <strong>{merchantName}</strong>!
                    </p>
                    <div style='background: #10B981; color: white; padding: 15px 30px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                        <span style='font-size: 18px; font-weight: bold;'>Show your QR code to collect your food</span>
                    </div>
                    <p style='color: #6b7280; font-size: 14px;'>
                        Please pick up your order within the pickup window to ensure freshness.
                    </p>
                </div>
                <div style='background: #1f2937; padding: 20px; text-align: center;'>
                    <p style='color: #9ca3af; margin: 0; font-size: 12px;'>
                        © 2026 FrugalBites. Save food, save money! 🌱
                    </p>
                </div>
            </div>";

        await SendEmailAsync(email, subject, htmlContent);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        var from = new EmailAddress(_fromEmail, _fromName);
        var to = new EmailAddress(toEmail);
        var plainTextContent = System.Text.RegularExpressions.Regex.Replace(htmlContent, "<[^>]+>", "");
        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

        try
        {
            var response = await _client.SendEmailAsync(msg);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
            }
            else
            {
                _logger.LogWarning("Failed to send email to {Email}. Status: {StatusCode}", toEmail, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", toEmail);
            throw;
        }
    }
}
