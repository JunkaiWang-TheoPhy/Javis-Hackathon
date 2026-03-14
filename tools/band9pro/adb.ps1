param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

$adbPath = "C:\Users\14245\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    throw "adb.exe not found at $adbPath"
}

& $adbPath $Args
exit $LASTEXITCODE
