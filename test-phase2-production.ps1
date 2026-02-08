#!/usr/bin/env pwsh
# Test de Phase 2 - Tenant Service API en Production
# Tester les 9 endpoints du service Tenant sur Render

$ApiUrl = "https://sigac-api.onrender.com/api"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "=== TEST PHASE 2: TENANT SERVICE API ===" -ForegroundColor Cyan
Write-Host "Timestamp: $Timestamp" -ForegroundColor Gray
Write-Host "API URL: $ApiUrl" -ForegroundColor Gray
Write-Host ""

# Fonction pour afficher les résultats
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Authorization = $null
    )
    
    Write-Host "📌 TEST: $Name" -ForegroundColor Yellow
    Write-Host "   Method: $Method | Endpoint: $Endpoint"
    
    $Url = "$ApiUrl$Endpoint"
    
    try {
        $params = @{
            Uri             = $Url
            Method          = $Method
            ContentType     = "application/json"
            ErrorAction     = "Stop"
            TimeoutSec      = 10
        }
        
        if ($Body) {
            $params['Body'] = $Body | ConvertTo-Json -Depth 10
        }
        
        if ($Authorization) {
            $params['Headers'] = @{
                "Authorization" = "Bearer $Authorization"
            }
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "   ✅ Status: SUCCESS" -ForegroundColor Green
        Write-Host "   Response Preview:" -ForegroundColor Green
        
        if ($response -is [System.Collections.ArrayList] -or $response -is [Array]) {
            Write-Host "   - Items: $($response.Count) records"
            if ($response.Count -gt 0) {
                Write-Host "   - First item: $($response[0] | ConvertTo-Json -Depth 2 -Compress)"
            }
        } elseif ($null -eq $response) {
            Write-Host "   - No content (204 No Content)"
        } else {
            Write-Host "   - $($response | ConvertTo-Json -Depth 2 -Compress)"
        }
        
    } catch {
        Write-Host "   ❌ Status: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# ===== TEST 1: GET /api/tenants (Paginated List) - PUBLIC =====
Test-Endpoint -Name "1. List Tenants (Paginated)" `
    -Method "GET" `
    -Endpoint "/tenants?page=1&pageSize=10"

# ===== TEST 2: GET /api/tenants/{id} (Get by ID) - PUBLIC =====
# Note: On teste avec le Default Tenant ID (00000000-0000-0000-0000-000000000000)
$DefaultTenantId = "00000000-0000-0000-0000-000000000000"
Test-Endpoint -Name "2. Get Tenant by ID" `
    -Method "GET" `
    -Endpoint "/tenants/$DefaultTenantId"

# ===== TEST 3: GET /api/tenants/slug/{slug} (Get by Slug) - PUBLIC =====
Test-Endpoint -Name "3. Get Tenant by Slug" `
    -Method "GET" `
    -Endpoint "/tenants/slug/default"

# ===== TEST 4: GET /api/tenants/{id}/stats (Statistics) - PUBLIC =====
Test-Endpoint -Name "4. Get Tenant Statistics" `
    -Method "GET" `
    -Endpoint "/tenants/$DefaultTenantId/stats"

# ===== TEST 5: GET /api/tenants/{id}/subscriptions/active (Active Subscription) - PUBLIC =====
Test-Endpoint -Name "5. Get Active Subscription" `
    -Method "GET" `
    -Endpoint "/tenants/$DefaultTenantId/subscriptions/active"

# ===== TEST 6-9: Write Operations (Admin Only) - Need Authentication =====
Write-Host "📊 WRITE OPERATIONS (POST/PUT/DELETE) - Require Admin Authentication" -ForegroundColor Magenta
Write-Host "Note: Pour tester les endpoints en écriture, vous avez besoin:" -ForegroundColor Gray
Write-Host "  1. D'un token JWT Admin valide" -ForegroundColor Gray
Write-Host "  2. Faire un login d'abord via: POST /auth/login" -ForegroundColor Gray
Write-Host ""
Write-Host "Exemple de test avec token:" -ForegroundColor Cyan
Write-Host '$token = "votre_jwt_token_admin_ici"' -ForegroundColor Gray
Write-Host '$response = Invoke-RestMethod -Uri "$ApiUrl/tenants" -Method POST -Headers @{"Authorization"="Bearer $token"} -Body $(@{name="NewTenant"; slug="new-tenant"; planEnum=1; createdBy="userid"} | ConvertTo-Json) -ContentType "application/json"' -ForegroundColor Gray
Write-Host ""

# ===== SUMMARY =====
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST SUMMARY                                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "✅ Public endpoints (1-5): Tested successfully if no errors above" -ForegroundColor Green
Write-Host "⚠️  Write endpoints (6-9): Require Admin JWT token (see instructions above)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. ✅ Phase 2 Backend: DEPLOYED to Render" -ForegroundColor Green
Write-Host "  2. ⏭️  Phase 2 Option 2: Start Frontend Development (React Tenant Management)" -ForegroundColor Yellow
Write-Host ""
