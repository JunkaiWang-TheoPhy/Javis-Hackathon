param(
  [string]$OutputDir = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'win-camera-common.ps1')

if (-not $OutputDir) {
  $OutputDir = Get-OpenClawCameraOutputDir
}

Get-WindowsCameraLoopStatus -OutputDir $OutputDir
