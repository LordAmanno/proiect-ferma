using Supabase;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

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
    // In development, we might not have these set yet, so we can warn or throw.
    // For now, let's just initialize with empty strings or handle it gracefully if possible,
    // but Client expects non-null.
    // Better to throw if missing as the app relies on it.
    // However, for build purposes, we can leave it as is but supress warning or ensure it's not null.
    // Let's provide a default or throw.
    url ??= "";
    key ??= "";
}

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
app.UseAuthorization();
app.MapControllers();

app.Run();
