Add-Type -AssemblyName System.Net.Http
$BaseUrl = "http://localhost:8081/api/v1"
$headers = @{ "Content-Type" = "application/json" }
$pass = 0; $fail = 0

function OK($msg)   { Write-Host "  [PASS] $msg" -ForegroundColor Green; $global:pass++ }
function FAIL($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red;   $global:fail++ }
function Section($title) { Write-Host "`n=== $title ===" -ForegroundColor Cyan }

# 1. HEALTH
Section "Backend Health"
try {
    $h = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method Get
    if ($h.status -eq "UP") { OK "Backend is UP" } else { FAIL "Backend status: $($h.status)" }
} catch { FAIL "Cannot reach backend: $($_.Exception.Message)" }

# 2. FRONTEND
Section "Frontend Health"
try {
    $f = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($f.StatusCode -eq 200) { OK "Frontend is UP (port 5173)" } else { FAIL "Frontend status: $($f.StatusCode)" }
} catch { FAIL "Cannot reach frontend: $($_.Exception.Message)" }

# 3. REGISTRATION
Section "Registration with Admin Role"
$testEmail = "verify_$(Get-Date -Format 'HHmmss')@example.com"
$registered = $false
try {
    $regBody = @{ email = $testEmail; password = "Password123!"; name = "Verify Admin"; role = "admin" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -Headers $headers -Body $regBody
    if ($r.success) { OK "Admin registration succeeded"; $registered = $true } else { FAIL "Registration failed: $($r.error)" }
} catch { FAIL "Registration error: $($_.Exception.Message)" }

# 4. LOGIN AND JWT
Section "Login and JWT Role Claim"
$TOKEN = $null
try {
    $loginBody = @{ email = $testEmail; password = "Password123!" } | ConvertTo-Json
    $l = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Headers $headers -Body $loginBody
    $TOKEN = $l.data.token
    if ($TOKEN) {
        $payload = $TOKEN.Split(".")[1]
        $pad = 4 - ($payload.Length % 4)
        if ($pad -ne 4) { $payload += "=" * $pad }
        $claims = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
        OK "Login succeeded, token received"
        if ($claims.role -eq "admin") { OK "JWT contains role=admin" } else { FAIL "JWT role mismatch: $($claims.role)" }
        OK "JWT user_id: $($claims.user_id)"
    } else {
        FAIL "No token returned"
    }
} catch { FAIL "Login error: $($_.Exception.Message)" }

# 5. RBAC REJECTION
Section "RBAC Reject Unauthenticated"
try {
    Invoke-RestMethod -Uri "$BaseUrl/admin/events/" -Method Post -Headers $headers -Body "{}" | Out-Null
    FAIL "Should have been rejected!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) { OK "Correctly rejected (401)" } else { FAIL "Wrong status: $code" }
}

# 6. CREATE EVENT
Section "Create Event Admin Only"
$createdEventId = $null
if ($TOKEN) {
    $authJson = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $TOKEN" }
    $eventBody = @{
        title         = "Verification Event $(Get-Date -Format 'HHmmss')"
        description   = "Auto-created by verification script"
        category      = "Tech"
        start_time    = "2026-06-01T10:00:00Z"
        total_tickets = 200
        price         = 99.0
    } | ConvertTo-Json
    try {
        $e = Invoke-RestMethod -Uri "$BaseUrl/admin/events/" -Method Post -Headers $authJson -Body $eventBody
        if ($e.success -and $e.data.id) {
            OK "Event created: ID=$($e.data.id)"
            OK "Title: $($e.data.title)"
            OK "Status: $($e.data.status)"
            $createdEventId = $e.data.id
        } else { FAIL "Create event returned: $($e | ConvertTo-Json)" }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $body = (New-Object System.IO.StreamReader($stream)).ReadToEnd()
        FAIL "HTTP $code -- $body"
    }
} else { FAIL "Skipped (no token)" }

# 7. IMAGE UPLOAD
Section "Image Upload Endpoint"
if ($TOKEN) {
    $tmpImg = [System.IO.Path]::GetTempFileName() + ".png"
    [System.IO.File]::WriteAllBytes($tmpImg, [byte[]](137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,248,207,192,0,0,0,2,0,1,226,33,188,51,0,0,0,0,73,69,78,68,174,66,96,130))
    try {
        $form = New-Object System.Net.Http.MultipartFormDataContent
        $fileBytes = [System.IO.File]::ReadAllBytes($tmpImg)
        $fileContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
        $form.Add($fileContent, "image", "test.png")
        $client = New-Object System.Net.Http.HttpClient
        $client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $TOKEN)
        $response = $client.PostAsync("$BaseUrl/admin/upload", $form).Result
        $body = $response.Content.ReadAsStringAsync().Result
        $parsed = $body | ConvertFrom-Json
        if ($response.IsSuccessStatusCode -and $parsed.success) {
            OK "Image uploaded! URL: $($parsed.data.url)"
        } else {
            FAIL "Upload failed HTTP $($response.StatusCode.value__): $body"
        }
        $client.Dispose()
    } catch { FAIL "Upload error: $($_.Exception.Message)" }
    Remove-Item $tmpImg -Force -ErrorAction SilentlyContinue
} else { FAIL "Skipped (no token)" }

# 8. LIST EVENTS
Section "List Events Public"
try {
    $ev = Invoke-RestMethod -Uri "$BaseUrl/events/?status=published" -Method Get
    OK "Events endpoint reachable. Total published: $($ev.meta.total)"
} catch { FAIL "Events list error: $($_.Exception.Message)" }

# SUMMARY
Write-Host ""
Write-Host "==============================================" -ForegroundColor White
Write-Host " RESULTS: $pass PASSED   $fail FAILED" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "==============================================" -ForegroundColor White
