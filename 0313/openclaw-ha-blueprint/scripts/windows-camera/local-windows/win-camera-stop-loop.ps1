param(
  [string]$OutputDir = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'win-camera-common.ps1')

if (-not $OutputDir) {
  $OutputDir = Get-OpenClawCameraOutputDir
}

$pidPath = Get-OpenClawCameraPidPath -OutputDir $OutputDir
if (-not (Test-Path $pidPath)) {
  return [pscustomobject]@{
    stopped = $false
    reason = 'pid file missing'
    outputDir = $OutputDir
  }
}

$pid = [int](Get-Content -Path $pidPath -Raw)
try {
  Stop-Process -Id $pid -Force -ErrorAction Stop
} catch {
}

Remove-Item -Path $pidPath -ErrorAction SilentlyContinue

[pscustomobject]@{
  stopped = $true
  pid = $pid
  outputDir = $OutputDir
}
