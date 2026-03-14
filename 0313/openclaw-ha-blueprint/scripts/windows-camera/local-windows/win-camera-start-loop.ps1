param(
  [string]$CameraName = '',
  [string]$OutputDir = '',
  [int]$IntervalMs = 1000,
  [string]$VideoSize = '',
  [int]$JpegQuality = 2,
  [int]$WarmupMs = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'win-camera-common.ps1')

if (-not $OutputDir) {
  $OutputDir = Get-OpenClawCameraOutputDir
}

$status = Get-WindowsCameraLoopStatus -OutputDir $OutputDir
if ($status.running) {
  return $status
}

$loopScript = Join-Path $PSScriptRoot 'win-camera-loop.ps1'
$arguments = @(
  '-NoLogo',
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', $loopScript,
  '-OutputDir', $OutputDir,
  '-IntervalMs', $IntervalMs.ToString(),
  '-JpegQuality', $JpegQuality.ToString(),
  '-WarmupMs', $WarmupMs.ToString()
)

if ($CameraName) {
  $arguments += @('-CameraName', $CameraName)
}

if ($VideoSize) {
  $arguments += @('-VideoSize', $VideoSize)
}

$proc = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 800

$status = Get-WindowsCameraLoopStatus -OutputDir $OutputDir
if (-not $status.running) {
  throw "Camera loop failed to start. Spawned PID: $($proc.Id)"
}

return $status
