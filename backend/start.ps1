param(
    [int]$Port = 8000,
    [switch]$Reload
)
$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $runtime)) {
    throw 'Create the backend .venv and install requirements.txt first. See backend/README.md.'
}
Push-Location $PSScriptRoot
try {
    & $runtime -c 'from app.ml.model_runtime import validate_model_runtime; validate_model_runtime()'
    if ($LASTEXITCODE -ne 0) { throw 'The model runtime check failed. Reinstall requirements.txt and restart.' }
    $serverArgs = @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', "$Port")
    if ($Reload) { $serverArgs += '--reload' }
    & $runtime @serverArgs
    if ($LASTEXITCODE -ne 0) { throw "API server exited with code $LASTEXITCODE" }
} finally {
    Pop-Location
}
