using Supabase;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Register FileStorageService
builder.Services.AddSingleton<FileStorageService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Supabase Configuration
var url = builder.Configuration["Supabase:Url"];
var key = builder.Configuration["Supabase:Key"];

if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key))
{
    url ??= "";
    key ??= "";
}

// Configure JWT Authentication (Using JWKS for modern Supabase projects)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MetadataAddress = $"{url}/auth/v1/.well-known/openid-configuration";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{url}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true // Key will be fetched automatically from MetadataAddress
        };
        
        // Allow reading token from Query String (for images/downloads)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

var options = new SupabaseOptions
{
    AutoRefreshToken = true,
    AutoConnectRealtime = true
};

// Register as Scoped so a new client (and potential auth state) is created per request,
// but we MUST initialize it. The issue is InitializeAsync is async, but constructors are not.
// The best pattern for Supabase in ASP.NET Core is usually Singleton if using service role,
// or Scoped if using user tokens. Here we are likely using anonymous or service key for now.
// However, the library requires InitializeAsync() to be called.
// We are calling it in the controllers now, which is safe.
builder.Services.AddScoped<Supabase.Client>(_ => new Supabase.Client(url!, key, options));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication(); // ⬅️ Enable Auth Middleware
app.UseAuthorization();
app.MapControllers();

app.Run();
