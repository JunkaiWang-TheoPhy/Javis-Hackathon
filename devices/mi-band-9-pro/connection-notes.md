# Connection Notes

## Current Facts

- The `Mi Band 9 Pro` is already paired with the `Xiaomi 12X`.
- The pairing and connect path runs through Xiaomi's official stack on the phone.
- Historical Xiaomi Fitness logs in this repo show:
  - `createBond`
  - `verifyDevice success`
  - `confirmBind success`
  - `device binder bind success`
  - UI state `已连接`

Relevant logs:

- [XiaomiFit.device.log](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tmp/wearablelog/1773510602684log/XiaomiFit.device.log)
- [XiaomiFit.main.log](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tmp/wearablelog/1773510602684log/XiaomiFit.main.log)

## Why The Computer Does Not Directly Talk To The Band

- USB gives the desktop an `adb` channel into the phone, not Bluetooth passthrough.
- The current phone-band relationship uses Xiaomi pairing and authentication state already stored on the phone.
- The most stable bridge is therefore:

`band -> phone -> gateway app -> adb tunnel -> desktop`

## Data Routing Notes

- Health metrics should come from `Health Connect` when available.
- Band connection state should be derived from Android Bluetooth state filtered by the known MAC:
  - `D0:AE:05:0D:A0:94`
- The gateway should keep Xiaomi Fitness as the pairing owner.

## Operational Risks

- Xiaomi Fitness may not write all metrics to `Health Connect` fast enough for second-by-second updates.
- HyperOS background management can kill the gateway unless battery optimization is disabled.
- If the band disconnects, the gateway should continue serving the last cached snapshot and mark the connection state as disconnected.
