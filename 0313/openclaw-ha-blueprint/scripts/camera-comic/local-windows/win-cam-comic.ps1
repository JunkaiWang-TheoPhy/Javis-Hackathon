param(
  [string]$CameraName = '',
  [string]$OutputDir = '',
  [int]$JpegQuality = 2,
  [string]$VideoSize = '',
  [int]$WarmupMs = 0,
  [string]$SshTarget = '',
  [string]$SshIdentity = '',
  [int]$SshPort = 0,
  [string]$RemoteWorkspace = '',
  [string]$HelperScript = '',
  [string]$PythonExe = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot '..\..\windows-camera\local-windows\win-camera-common.ps1')

function Get-ComicHelperPath {
  param(
    [string]$ConfiguredPath = ''
  )

  if ($ConfiguredPath) {
    return (Resolve-Path -Path $ConfiguredPath).Path
  }

  if ($env:OPENCLAW_COMIC_HELPER) {
    return (Resolve-Path -Path $env:OPENCLAW_COMIC_HELPER).Path
  }

  $defaultPath = Join-Path $PSScriptRoot '..\push_camera_comic_to_devbox.py'
  return (Resolve-Path -Path $defaultPath).Path
}

function Get-ComicPythonCommand {
  param(
    [string]$ConfiguredExe = ''
  )

  $candidate = if ($ConfiguredExe) {
    $ConfiguredExe
  } elseif ($env:OPENCLAW_COMIC_PYTHON_EXE) {
    $env:OPENCLAW_COMIC_PYTHON_EXE
  } else {
    ''
  }

  if ($candidate) {
    return @($candidate)
  }

  $python = Get-Command python.exe -ErrorAction SilentlyContinue
  if ($python) {
    return @($python.Source)
  }

  $py = Get-Command py.exe -ErrorAction SilentlyContinue
  if ($py) {
    return @($py.Source, '-3')
  }

  throw 'python.exe or py.exe not found. Install Python or set OPENCLAW_COMIC_PYTHON_EXE.'
}

if (-not $OutputDir) {
  $OutputDir = Get-OpenClawCameraOutputDir
}

if (-not $SshTarget) {
  $SshTarget = if ($env:OPENCLAW_COMIC_SSH_TARGET) { $env:OPENCLAW_COMIC_SSH_TARGET } else { 'devbox' }
}

if (-not $SshIdentity -and $env:OPENCLAW_COMIC_SSH_IDENTITY) {
  $SshIdentity = $env:OPENCLAW_COMIC_SSH_IDENTITY
}

if ($SshPort -le 0 -and $env:OPENCLAW_COMIC_SSH_PORT) {
  $SshPort = [int]$env:OPENCLAW_COMIC_SSH_PORT
}

if (-not $RemoteWorkspace) {
  $RemoteWorkspace = if ($env:OPENCLAW_COMIC_REMOTE_WORKSPACE) { $env:OPENCLAW_COMIC_REMOTE_WORKSPACE } else { '/home/devbox/.openclaw/workspace' }
}

$helperPath = Get-ComicHelperPath -ConfiguredPath $HelperScript
$pythonCommand = @(Get-ComicPythonCommand -ConfiguredExe $PythonExe)
$pythonExe = $pythonCommand[0]
$pythonArgs = @()
if ($pythonCommand.Count -gt 1) {
  $pythonArgs = @($pythonCommand[1..($pythonCommand.Count - 1)])
}

$metadata = Invoke-WindowsCameraShot `
  -CameraName $CameraName `
  -OutputPath (Get-OpenClawCameraLatestImagePath -OutputDir $OutputDir) `
  -JpegQuality $JpegQuality `
  -VideoSize $VideoSize `
  -WarmupMs $WarmupMs

$imagePath = Get-OpenClawCameraLatestImagePath -OutputDir $OutputDir
$metadataPath = Get-OpenClawCameraLatestMetaPath -OutputDir $OutputDir

if (-not (Test-Path $imagePath)) {
  throw "Latest image missing: $imagePath"
}

if (-not (Test-Path $metadataPath)) {
  throw "Latest metadata missing: $metadataPath"
}

$helperArgs = @(
  $helperPath,
  '--source', 'localpc',
  '--input', $imagePath,
  '--metadata', $metadataPath,
  '--ssh-target', $SshTarget,
  '--remote-workspace', $RemoteWorkspace
)

if ($SshIdentity) {
  $helperArgs += @('--ssh-identity', $SshIdentity)
}

if ($SshPort -gt 0) {
  $helperArgs += @('--ssh-port', $SshPort.ToString())
}

& $pythonExe @pythonArgs @helperArgs
if ($LASTEXITCODE -ne 0) {
  throw "cloud comic helper failed with exit code $LASTEXITCODE"
}
