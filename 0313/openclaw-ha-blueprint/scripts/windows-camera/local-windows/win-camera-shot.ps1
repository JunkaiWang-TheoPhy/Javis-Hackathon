param(
  [string]$CameraName = '',
  [string]$OutputPath = '',
  [int]$JpegQuality = 2,
  [string]$VideoSize = '',
  [int]$WarmupMs = 0
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'win-camera-common.ps1')

if (-not $OutputPath) {
  $OutputPath = Get-OpenClawCameraLatestImagePath
}

Invoke-WindowsCameraShot `
  -CameraName $CameraName `
  -OutputPath $OutputPath `
  -JpegQuality $JpegQuality `
  -VideoSize $VideoSize `
  -WarmupMs $WarmupMs
