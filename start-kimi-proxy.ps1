param(
  [string]$EnvFile = ""
)

if ($Env:OPENROUTER_API_KEY) {
  # Key already set, use it
} elseif (Test-Path ".env") {
  $envContent = Get-Content ".env" -Raw
  if ($envContent -match 'OPENROUTER_API_KEY=(.+)') {
    $Env:OPENROUTER_API_KEY = $matches[1]
  }
} elseif (Test-Path ".env.local") {
  $envContent = Get-Content ".env.local" -Raw
  if ($envContent -match 'OPENROUTER_API_KEY=(.+)') {
    $Env:OPENROUTER_API_KEY = $matches[1]
  }
}

if (-not $Env:OPENROUTER_API_KEY) {
  Write-Host ""
  Write-Host "  ERROR: OPENROUTER_API_KEY is not set."
  Write-Host ""
  Write-Host "  Set it first:"
  Write-Host '    $env:OPENROUTER_API_KEY = "sk-or-v1-..."'
  Write-Host "  Then run this script again."
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "  Starting Kimi K2.6 Crucible Proxy..."
Write-Host "  API key length: $($Env:OPENROUTER_API_KEY.Length) chars"
Write-Host ""
node openrouter-kimi-crucible-proxy.js
