param(
  [string]$CameraName = '',
  [string]$OutputDir = '',
  [int]$IntervalMs = 1000,
  [string]$VideoSize = '',
  [int]$JpegQuality = 2,
  [int]$WarmupMs = 0,
  [int]$MaxFrames = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'win-camera-common.ps1')

if (-not $OutputDir) {
  $OutputDir = Get-OpenClawCameraOutputDir
}

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$pidPath = Get-OpenClawCameraPidPath -OutputDir $OutputDir
$latestPath = Get-OpenClawCameraLatestImagePath -OutputDir $OutputDir
Set-Content -Path $pidPath -Value $PID -NoNewline

$count = 0
try {
  while ($true) {
    Invoke-WindowsCameraShot `
      -CameraName $CameraName `
      -OutputPath $latestPath `
      -JpegQuality $JpegQuality `
      -VideoSize $VideoSize `
      -WarmupMs $WarmupMs | Out-Null

    $count += 1
    if ($MaxFrames -gt 0 -and $count -ge $MaxFrames) {
      break
    }

    Start-Sleep -Milliseconds $IntervalMs
  }
} finally {
  Remove-Item -Path $pidPath -ErrorAction SilentlyContinue
}
