# Xiaomi Band 9 Pro local dev prep

This folder contains the Windows-side tools needed to prepare for Band 9 Pro development on this machine.

## What is already prepared

- `adb` was installed from Google Android SDK Platform-Tools via `winget`.
- `.NET SDK 8` was installed so local WinRT BLE tools can be built reliably on Windows.
- A native BLE scanner is included here and uses Windows WinRT directly, so it does not depend on Python BLE packages.
- Bluetooth service `bthserv` is available on this machine.

## Important constraints

- Xiaomi Band 9 Pro cannot be fully onboarded from the PC alone.
- First pairing still needs to happen in the official `Mi Fitness` phone app.
- For later custom development, you will usually need the Xiaomi `auth key` / token that Gadgetbridge documents for Xiaomi devices.
- Gadgetbridge currently lists `Mi Band 9 Pro` as supported but experimental / feature-unknown, which is useful as a protocol reference, not a guarantee that every feature already works.

## Use the BLE scanner

From the repo root:

```powershell
.\tools\band9pro\scan_ble.ps1 -Seconds 15
.\tools\band9pro\scan_ble.ps1 -Seconds 20 -Name Band
```

The wrapper builds and runs `BleScanner/BleScanner.csproj` with `dotnet`.

## ADB note

The `adb` binary installed by `winget` is located at:

```text
C:\Users\14245\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe
```

New terminals should pick up `adb` from `PATH`. If the current shell still cannot resolve it, reopen the terminal.
You can also use the wrapper here immediately:

```powershell
.\tools\band9pro\adb.ps1 --version
.\tools\band9pro\adb.ps1 devices
```

## Recommended next steps

1. Pair the Band 9 Pro with `Mi Fitness` on an Android phone.
2. Enable Android developer options and USB debugging on that phone.
3. Confirm `adb devices` can see the phone.
4. Extract the Xiaomi `auth key` using a phone-side flow compatible with current Gadgetbridge / huami-token guidance.
5. Use the BLE scanner here to record the watch advertisement name and MAC address before writing a custom client.

## References

- Gadgetbridge compatibility list: https://gadgetbridge.org/gadgets/wearables/
- Gadgetbridge Xiaomi authentication docs: https://gadgetbridge.org/basics/pairing/mi-xiaomi/
