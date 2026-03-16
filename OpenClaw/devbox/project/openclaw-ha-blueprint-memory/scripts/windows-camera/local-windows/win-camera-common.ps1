Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-OpenClawFfmpegPath {
  $command = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $roots = @(
    (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'),
    (Join-Path $HOME '.local\bin')
  )

  foreach ($root in $roots) {
    if (-not (Test-Path $root)) {
      continue
    }

    $match = Get-ChildItem -Path $root -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue |
      Select-Object -First 1

    if ($match) {
      return $match.FullName
    }
  }

  throw 'ffmpeg.exe not found. Install FFmpeg first.'
}

function Get-WindowsCameraDevices {
  $ffmpeg = Get-OpenClawFfmpegPath
  $ffmpegEscaped = $ffmpeg.Replace('"', '\"')
  $commandLine = """$ffmpegEscaped"" -hide_banner -list_devices true -f dshow -i dummy 2>&1"
  $output = & cmd.exe /d /c $commandLine
  $devices = foreach ($line in $output) {
    if ($line -match '^\[dshow @ .*?\] "(.+)" \(video\)$') {
      $matches[1]
    }
  }

  return @($devices | Select-Object -Unique)
}

function Get-DefaultWindowsCameraDevice {
  $devices = @(Get-WindowsCameraDevices)
  if ($devices.Count -eq 0) {
    throw 'No DirectShow video device was found.'
  }

  return $devices[0]
}

function Get-OpenClawCameraOutputDir {
  return (Join-Path $env:LOCALAPPDATA 'Temp\openclaw-camera')
}

function Get-OpenClawCameraPidPath {
  param(
    [string]$OutputDir = (Get-OpenClawCameraOutputDir)
  )

  return (Join-Path $OutputDir 'capture-loop.pid')
}

function Get-OpenClawCameraLatestImagePath {
  param(
    [string]$OutputDir = (Get-OpenClawCameraOutputDir)
  )

  return (Join-Path $OutputDir 'latest.jpg')
}

function Get-OpenClawCameraLatestMetaPath {
  param(
    [string]$OutputDir = (Get-OpenClawCameraOutputDir)
  )

  return (Join-Path $OutputDir 'latest.json')
}

function Write-OpenClawCameraMetadata {
  param(
    [Parameter(Mandatory = $true)]
    [string]$MetadataPath,
    [Parameter(Mandatory = $true)]
    [psobject]$Metadata
  )

  $Metadata | ConvertTo-Json -Depth 6 | Set-Content -Path $MetadataPath -Encoding UTF8
}

function Invoke-WindowsCameraShot {
  param(
    [string]$CameraName = '',
    [string]$OutputPath = (Get-OpenClawCameraLatestImagePath),
    [int]$JpegQuality = 2,
    [string]$VideoSize = '',
    [int]$WarmupMs = 0
  )

  if (-not $CameraName) {
    $CameraName = Get-DefaultWindowsCameraDevice
  }

  $ffmpeg = Get-OpenClawFfmpegPath
  $outputDir = Split-Path -Parent $OutputPath
  if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  }

  if ($WarmupMs -gt 0) {
    Start-Sleep -Milliseconds $WarmupMs
  }

  $args = @(
    '-hide_banner',
    '-loglevel', 'error',
    '-y',
    '-f', 'dshow'
  )

  if ($VideoSize) {
    $args += @('-video_size', $VideoSize)
  }

  $args += @(
    '-rtbufsize', '256M',
    '-i', "video=$CameraName",
    '-frames:v', '1',
    '-update', '1',
    '-q:v', $JpegQuality.ToString(),
    $OutputPath
  )

  & $ffmpeg @args
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg capture failed with exit code $LASTEXITCODE"
  }

  $item = Get-Item -Path $OutputPath
  $metadata = [pscustomobject]@{
    cameraName = $CameraName
    outputPath = $item.FullName
    fileName = $item.Name
    length = $item.Length
    capturedAt = (Get-Date).ToString('o')
    videoSize = if ($VideoSize) { $VideoSize } else { $null }
    jpegQuality = $JpegQuality
  }

  $metaPath = Get-OpenClawCameraLatestMetaPath -OutputDir $outputDir
  Write-OpenClawCameraMetadata -MetadataPath $metaPath -Metadata $metadata

  return $metadata
}

function Get-WindowsCameraLoopStatus {
  param(
    [string]$OutputDir = (Get-OpenClawCameraOutputDir)
  )

  $pidPath = Get-OpenClawCameraPidPath -OutputDir $OutputDir
  $latestPath = Get-OpenClawCameraLatestImagePath -OutputDir $OutputDir
  $metaPath = Get-OpenClawCameraLatestMetaPath -OutputDir $OutputDir

  $loopPid = $null
  $process = $null
  if (Test-Path $pidPath) {
    try {
      $loopPid = [int](Get-Content -Path $pidPath -Raw)
      $process = Get-Process -Id $loopPid -ErrorAction Stop
    } catch {
      $loopPid = $null
      $process = $null
    }
  }

  $latest = $null
  if (Test-Path $latestPath) {
    $item = Get-Item -Path $latestPath
    $latest = [pscustomobject]@{
      path = $item.FullName
      length = $item.Length
      lastWriteTime = $item.LastWriteTime.ToString('o')
    }
  }

  $meta = $null
  if (Test-Path $metaPath) {
    try {
      $meta = Get-Content -Path $metaPath -Raw | ConvertFrom-Json
    } catch {
      $meta = $null
    }
  }

  return [pscustomobject]@{
    running = [bool]$process
    pid = $loopPid
    outputDir = $OutputDir
    latestImage = $latest
    latestMetadata = $meta
  }
}
