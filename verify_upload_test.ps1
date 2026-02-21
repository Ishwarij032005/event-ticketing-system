$BaseUrl = "http://localhost:8081/api/v1"
$headers = @{ "Content-Type" = "application/json" }

# Login to get token
$loginBody = @{
    email = "admin_verify@example.com"
    password = "Password123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Headers $headers -Body $loginBody
$TOKEN = $loginRes.data.token
Write-Host "Got token: $(if($TOKEN) {'YES'} else {'NO'})"

# Test the upload endpoint
$authHeaders = @{ "Authorization" = "Bearer $TOKEN" }
Write-Host "`n=== Testing upload endpoint ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/admin/upload" -Method Post -Headers $authHeaders -UseBasicParsing
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Body: $($r.Content)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "HTTP $code : $body"
}

# Test create event
Write-Host "`n=== Testing create event ===" -ForegroundColor Cyan
$authJsonHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $TOKEN" }
$eventBody = @{
    title = "Test Event"
    description = "A test event"
    category = "Tech"
    start_time = "2026-05-01T10:00:00Z"
    total_tickets = 100
    price = 50.0
} | ConvertTo-Json

try {
    $eventRes = Invoke-RestMethod -Uri "$BaseUrl/admin/events/" -Method Post -Headers $authJsonHeaders -Body $eventBody
    Write-Host "Event created! ID: $($eventRes.data.id)" -ForegroundColor Green
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "HTTP $code : $body" -ForegroundColor Red
}
