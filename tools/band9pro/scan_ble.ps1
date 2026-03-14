param(
    [int]$Seconds = 10,
    [string]$Name = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Join-Path $scriptDir "BleScanner\BleScanner.csproj"
$dotnetCandidates = @(
    "C:\Program Files\dotnet\dotnet.exe",
    "C:\Program Files (x86)\dotnet\dotnet.exe"
)
$dotnetPath = $dotnetCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $dotnetPath) {
    throw "dotnet.exe not found. Install .NET SDK 8 or newer first."
}

$runArgs = @("--seconds", $Seconds.ToString())
if ($Name) {
    $runArgs += @("--name", $Name)
}

& $dotnetPath run --project $projectPath -- $runArgs
exit $LASTEXITCODE
