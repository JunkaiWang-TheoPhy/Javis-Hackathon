$ErrorActionPreference = "Stop"

$AdbBin = if ($env:ADB_BIN) { $env:ADB_BIN } else { $null }
$AdbSerial = if ($env:ADB_SERIAL) { $env:ADB_SERIAL } else { "4722a997" }
$GatewayPort = if ($env:GATEWAY_PORT) { $env:GATEWAY_PORT } else { "8765" }
$PackageName = "com.javis.wearable.gateway"
$ActivityName = "$PackageName/.MainActivity"
$ServiceName = "$PackageName/.service.GatewayForegroundService"
$ActionStart = "$PackageName.action.START"

if (-not $AdbBin) {
    $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbCommand) {
        $AdbBin = $adbCommand.Source
    } else {
        $candidate = Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk\platform-tools\adb.exe"
        if (Test-Path $candidate) {
            $AdbBin = $candidate
        } else {
            throw "Unable to find adb. Set ADB_BIN or add adb to PATH."
        }
    }
}

& $AdbBin -s $AdbSerial wait-for-device | Out-Null
& $AdbBin -s $AdbSerial shell am start -n $ActivityName | Out-Null
& $AdbBin -s $AdbSerial shell am start-foreground-service -n $ServiceName -a $ActionStart | Out-Null
& $AdbBin -s $AdbSerial forward --remove "tcp:$GatewayPort" 2>$null
& $AdbBin -s $AdbSerial forward "tcp:$GatewayPort" "tcp:$GatewayPort" | Out-Null

Write-Host "Gateway forwarded to http://127.0.0.1:$GatewayPort"
