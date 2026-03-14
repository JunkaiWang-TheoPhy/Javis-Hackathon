# Mi Band 9 Pro

This directory collects the stable configuration, connection notes, gateway implementation, and desktop usage needed to work with the `Xiaomi Smart Band 9 Pro` in this repo.

## Current Device Pairing

- Band name: `Xiaomi Smart Band 9 Pro A094`
- Band MAC: `D0:AE:05:0D:A0:94`
- Band DID: `940134049`
- Band model: `miwear.watch.n67cn`
- Band firmware: `3.1.171`
- Phone model: `Xiaomi 12X`
- Phone ADB serial: `4722a997`

The band is paired to the phone, not directly to this computer. The gateway strategy is:

`Mi Band 9 Pro -> Xiaomi 12X -> Android gateway app -> HTTP/SSE -> desktop`

## Directory Map

- [device-profile.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/device-profile.json): stable device and phone identity
- [connection-notes.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/connection-notes.md): pairing facts, limits, and routing notes
- [gateway/desktop/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/gateway/desktop/README.md): desktop-side tunnel and client usage
- [tmp/wearablelog/1773510602684log](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tmp/wearablelog/1773510602684log): captured Xiaomi Fitness logs

## macOS / Windows Workflow

1. Connect the `Xiaomi 12X` over USB with `adb` authorized.
2. Start the Android gateway app on the phone.
3. Expose the phone-local gateway port to the desktop:

```bash
adb reverse tcp:8765 tcp:8765
```

Fallback:

```bash
adb forward tcp:8765 tcp:8765
```

4. Read snapshot data:

```bash
curl http://127.0.0.1:8765/status
curl http://127.0.0.1:8765/health/latest
curl -N http://127.0.0.1:8765/events
```

## Known Limits

- The desktop does not directly pair to the band.
- Xiaomi Fitness remains the source-of-truth pairing app.
- Health data is expected to be near-real-time, not raw BLE live telemetry.
- Xiaomi/HyperOS background restrictions can stop long-running collection unless the gateway app is allowed to run in foreground and ignore battery optimization.
