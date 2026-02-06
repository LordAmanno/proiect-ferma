using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Supabase;
using System.Globalization;
using System.Linq;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/assistant")]
public class AssistantController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly Client _supabase;

    public AssistantController(IConfiguration configuration, Client supabase)
    {
        _configuration = configuration;
        _supabase = supabase;
    }

    public class AssistantMessage
    {
        public string Role { get; set; } = "";
        public string Content { get; set; } = "";
    }

    public class AssistantChatRequest
    {
        public List<AssistantMessage> Messages { get; set; } = [];
        public double? Temperature { get; set; }
        public int? MaxTokens { get; set; }
        public string? SystemPrompt { get; set; }
    }

    public class AssistantChatResponse
    {
        public string Content { get; set; } = "";
        public object Raw { get; set; } = default!;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] AssistantChatRequest request)
    {
        var apiKey = _configuration["OpenAI:ApiKey"];
        apiKey ??= Environment.GetEnvironmentVariable("OpenAI__ApiKey");
        apiKey ??= Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        var model = _configuration["OpenAI:Model"];
        model ??= Environment.GetEnvironmentVariable("OpenAI__Model");
        model ??= Environment.GetEnvironmentVariable("OPENAI_MODEL");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(500, new { error = "OpenAI API key missing in configuration" });
        }
        if (string.IsNullOrWhiteSpace(model))
        {
            return StatusCode(500, new { error = "OpenAI model missing in configuration" });
        }
        if (request.Messages == null || request.Messages.Count == 0)
        {
            return BadRequest(new { error = "Messages cannot be empty" });
        }

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var systemPrompt = request.SystemPrompt;
        systemPrompt ??= _configuration["OpenAI:SystemPrompt"];
        var inputItems = new List<object>();
        if (!string.IsNullOrWhiteSpace(systemPrompt))
        {
            inputItems.Add(new { role = "developer", content = systemPrompt });
        }
        inputItems.AddRange(request.Messages.Select(m => new { role = m.Role, content = m.Content }));
        var tools = new[]
        {
            new Dictionary<string, object?>
            {
                ["type"] = "function",
                ["name"] = "calc",
                ["description"] = "Evaluate a basic arithmetic expression with +,-,*,/ and parentheses.",
                ["parameters"] = new Dictionary<string, object?>
                {
                    ["type"] = "object",
                    ["properties"] = new Dictionary<string, object?>
                    {
                        ["expression"] = new Dictionary<string, object?>
                        {
                            ["type"] = "string"
                        }
                    },
                    ["required"] = new[] { "expression" }
                }
            },
            new Dictionary<string, object?>
            {
                ["type"] = "function",
                ["name"] = "get_inventory_summary",
                ["description"] = "Return inventory counts and totals from the dashboard.",
                ["parameters"] = new Dictionary<string, object?>
                {
                    ["type"] = "object",
                    ["properties"] = new Dictionary<string, object?>(),
                    ["required"] = Array.Empty<string>()
                }
            }
        };
        var payload = new Dictionary<string, object?>
        {
            ["model"] = model,
            ["input"] = inputItems.ToArray(),
            ["tools"] = tools
        };
        if (request.Temperature.HasValue)
        {
            payload["temperature"] = request.Temperature.Value;
        }
        if (request.MaxTokens.HasValue)
        {
            payload["max_output_tokens"] = request.MaxTokens.Value;
        }

        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var response = await http.PostAsync("https://api.openai.com/v1/responses", content);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, new { error = "OpenAI API error", details = body });
        }

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var responseId = root.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
        var outputs = root.GetProperty("output");
        var toolCalls = new List<(string id, string name, JsonElement arguments)>();
        for (int i = 0; i < outputs.GetArrayLength(); i++)
        {
            var item = outputs[i];
            var type = item.GetProperty("type").GetString();
            if (type == "tool_call")
            {
                var callId = item.GetProperty("id").GetString() ?? "";
                var name = item.GetProperty("name").GetString() ?? "";
                var args = item.GetProperty("arguments");
                toolCalls.Add((callId, name, args));
            }
        }

        if (toolCalls.Count > 0 && !string.IsNullOrEmpty(responseId))
        {
            var toolOutputs = new List<Dictionary<string, object?>>();
            foreach (var call in toolCalls)
            {
                var output = await ExecuteTool(call.name, call.arguments);
                toolOutputs.Add(new Dictionary<string, object?>
                {
                    ["tool_call_id"] = call.id,
                    ["output"] = output
                });
            }

            var followPayload = new Dictionary<string, object?>
            {
                ["model"] = model,
                ["previous_response_id"] = responseId,
                ["tool_outputs"] = toolOutputs.ToArray()
            };
            var followJson = JsonSerializer.Serialize(followPayload);
            using var followContent = new StringContent(followJson, Encoding.UTF8, "application/json");
            using var followResponse = await http.PostAsync("https://api.openai.com/v1/responses", followContent);
            var followBody = await followResponse.Content.ReadAsStringAsync();
            if (!followResponse.IsSuccessStatusCode)
            {
                return StatusCode((int)followResponse.StatusCode, new { error = "OpenAI API error", details = followBody });
            }
            body = followBody;
            doc.Dispose();
            using var finalDoc = JsonDocument.Parse(body);
            var finalRoot = finalDoc.RootElement;
            outputs = finalRoot.GetProperty("output");
        }

        var sb = new StringBuilder();
        for (int i = 0; i < outputs.GetArrayLength(); i++)
        {
            var item = outputs[i];
            if (item.GetProperty("type").GetString() == "message")
            {
                var contentArr = item.GetProperty("content");
                for (int j = 0; j < contentArr.GetArrayLength(); j++)
                {
                    var c = contentArr[j];
                    if (c.TryGetProperty("type", out var ct) && ct.GetString() == "output_text")
                    {
                        sb.Append(c.GetProperty("text").GetString());
                    }
                }
            }
        }
        var contentText = sb.ToString();
        if (string.IsNullOrWhiteSpace(contentText))
        {
            return StatusCode(500, new { error = "No text output returned from OpenAI" });
        }
        var result = new AssistantChatResponse
        {
            Content = contentText,
            Raw = JsonSerializer.Deserialize<object>(body)!
        };
        return Ok(result);
    }

    private static double EvaluateExpression(string expression)
    {
        var tokens = Tokenize(expression);
        int index = 0;
        double ParseExpression()
        {
            double value = ParseTerm();
            while (index < tokens.Count && (tokens[index] == "+" || tokens[index] == "-"))
            {
                var op = tokens[index++];
                var rhs = ParseTerm();
                value = op == "+" ? value + rhs : value - rhs;
            }
            return value;
        }
        double ParseTerm()
        {
            double value = ParseFactor();
            while (index < tokens.Count && (tokens[index] == "*" || tokens[index] == "/"))
            {
                var op = tokens[index++];
                var rhs = ParseFactor();
                if (op == "/")
                {
                    if (rhs == 0) throw new InvalidOperationException("Division by zero");
                    value /= rhs;
                }
                else
                {
                    value *= rhs;
                }
            }
            return value;
        }
        double ParseFactor()
        {
            if (index >= tokens.Count) throw new InvalidOperationException("Unexpected end");
            var t = tokens[index++];
            if (t == "(")
            {
                var val = ParseExpression();
                if (index >= tokens.Count || tokens[index++] != ")") throw new InvalidOperationException("Missing ')'");
                return val;
            }
            if (t == "+" || t == "-")
            {
                var sign = t == "-" ? -1 : 1;
                return sign * ParseFactor();
            }
            if (double.TryParse(t, NumberStyles.Float, CultureInfo.InvariantCulture, out var num)) return num;
            throw new InvalidOperationException("Invalid token");
        }
        var result = ParseExpression();
        if (index != tokens.Count) throw new InvalidOperationException("Unexpected tokens");
        return result;
    }

    private static List<string> Tokenize(string s)
    {
        var tokens = new List<string>();
        int i = 0;
        while (i < s.Length)
        {
            var ch = s[i];
            if (char.IsWhiteSpace(ch)) { i++; continue; }
            if ("+-*/()".IndexOf(ch) >= 0)
            {
                tokens.Add(ch.ToString());
                i++;
                continue;
            }
            int start = i;
            while (i < s.Length && (char.IsDigit(s[i]) || s[i] == '.'))
            {
                i++;
            }
            tokens.Add(s.Substring(start, i - start));
        }
        return tokens;
    }

    private async Task<string> ExecuteTool(string name, JsonElement arguments)
    {
        if (string.Equals(name, "calc", StringComparison.OrdinalIgnoreCase))
        {
            var expr = arguments.TryGetProperty("expression", out var exprEl) ? exprEl.GetString() : null;
            if (string.IsNullOrWhiteSpace(expr)) throw new InvalidOperationException("Missing expression");
            var value = EvaluateExpression(expr);
            return value.ToString(CultureInfo.InvariantCulture);
        }
        if (string.Equals(name, "get_inventory_summary", StringComparison.OrdinalIgnoreCase))
        {
            await _supabase.InitializeAsync();
            var response = await _supabase.From<InventoryItem>().Get();
            var items = response.Models;
            var count = items.Count;
            double totalQty = items.Sum(x => Convert.ToDouble(x.Quantity));
            var result = new Dictionary<string, object?>
            {
                ["count"] = count,
                ["totalQuantity"] = totalQty
            };
            return JsonSerializer.Serialize(result);
        }
        throw new InvalidOperationException("Unknown tool");
    }
}
