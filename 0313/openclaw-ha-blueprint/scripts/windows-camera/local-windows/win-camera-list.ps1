Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'win-camera-common.ps1')

Get-WindowsCameraDevices | ForEach-Object {
  [pscustomobject]@{
    cameraName = $_
  }
}
