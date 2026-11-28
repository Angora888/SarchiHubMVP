using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RestaurantHub.Api.Data;
using RestaurantHub.Api.BusinessDirectory;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.


builder.Services.AddControllers()
   .AddJsonOptions(options =>
   {
       options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
   });
builder.Services.AddDbContext<RestaurantHubContext>(options =>
   options.UseNpgsql(
       builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddDbContext<DirectoryDbContext>(options =>
   options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
//builder.Services.AddOpenApi();
//JwtSecurityTokenHandler.DefaultMapInboundClaims = false;
// Configure JWT authentication
var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
   options.TokenValidationParameters = new TokenValidationParameters
   {
       ValidateIssuer = true,
       ValidateAudience = true,
       ValidateLifetime = true,
       ValidateIssuerSigningKey = true,
       ValidIssuer = jwt["Issuer"],
       ValidAudience = jwt["Audience"],
       IssuerSigningKey = new SymmetricSecurityKey(
           Encoding.UTF8.GetBytes(jwt["Key"]!))
   };
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("DirectoryAdmin", policy => policy
        .RequireAuthenticatedUser()
        .RequireClaim("directory_admin", "true"));
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    // Per-process protection. Never trust arbitrary X-Forwarded-For headers.
    var publicOrderLimit = Math.Clamp(builder.Configuration.GetValue("RateLimits:PublicOrdersPerMinute", 60), 1, 10000);
    options.AddPolicy("public-orders", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter("public-orders:" + ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = publicOrderLimit, Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0, AutoReplenishment = true
        });
    });
    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers["Retry-After"] = Math.Ceiling(retryAfter.TotalSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
        await context.HttpContext.Response.WriteAsJsonAsync(new { message = "Demasiadas solicitudes. Intente nuevamente en unos momentos." }, cancellationToken);
    };
    options.AddPolicy("directory-admin-login", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter("directory-admin-login:" + ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5, Window = TimeSpan.FromMinutes(15), QueueLimit = 0,
            AutoReplenishment = true
        });
    });
    options.AddPolicy("directory-visits", context =>
    {
        // Simple abuse limit; browser sessions are deduplicated on the client.
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter("directory-visits:" + ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100, Window = TimeSpan.FromHours(1), QueueLimit = 0,
            AutoReplenishment = true
        });
    });
    options.AddPolicy("directory-submissions", context =>
    {
        // Local abuse control only; use a trusted forwarded-header configuration behind Azure.
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 3, Window = TimeSpan.FromHours(1), QueueLimit = 0,
            AutoReplenishment = true
        });
    });
});

var allowedOrigins = (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
    .Append("https://directoriosarchi.vercel.app")
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp",
        policy =>
        {
            policy.AllowAnyHeader().AllowAnyMethod();
            if (builder.Environment.IsDevelopment())
                policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173");
            else if (allowedOrigins.Length > 0)
                policy.WithOrigins(allowedOrigins);
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS is terminated by the hosting reverse proxy. Configure forwarded headers
// and HTTPS redirection together when the proxy is trusted.

app.UseRouting();
app.UseCors("ReactApp");
app.UseRateLimiter();

app.UseAuthentication();
app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();
//app.Urls.Add("http://0.0.0.0:" + Environment.GetEnvironmentVariable("PORT"));
app.Run();
