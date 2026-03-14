# Mi Band 9 Pro Gateway Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-pass Android gateway on the Xiaomi 12X that exposes Mi Band 9 Pro metrics and connection state to a desktop over `HTTP + SSE`, plus desktop helper scripts and repo documentation.

**Architecture:** Keep the band paired with Xiaomi Fitness on the phone. Read metrics from `Health Connect`, read band connectivity from Android Bluetooth state, cache the latest snapshot in a foreground service, and expose that snapshot through an embedded local HTTP server on the phone. Access the server from macOS or Windows over `adb reverse` or `adb forward`.

**Tech Stack:** Kotlin, Android Gradle Plugin, Health Connect client, embedded HTTP server, Python 3 helper client, shell and PowerShell tunnel scripts, Python standard-library `unittest`.

---

## Chunk 1: Repo Docs And Stable Device Metadata

### Task 1: Add reusable repo docs for the band and gateway

**Files:**
- Create: `devices/mi-band-9-pro/README.md`
- Create: `devices/mi-band-9-pro/device-profile.json`
- Create: `devices/mi-band-9-pro/connection-notes.md`
- Create: `devices/mi-band-9-pro/gateway/desktop/README.md`

- [ ] **Step 1: Write the failing test**

Create a lightweight repo-level verification script target by asserting the new files do not yet exist:

```bash
test -f devices/mi-band-9-pro/README.md
```

Expected: exit code `1`

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
test -f devices/mi-band-9-pro/README.md
```

Expected: non-zero exit status because the docs do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the docs and include:
- the band identity (`MAC`, `did`, model, firmware)
- the phone identity (`adb_serial`, model)
- macOS and Windows gateway usage
- the current known limits of Xiaomi Fitness and Health Connect

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
test -f devices/mi-band-9-pro/README.md && test -f devices/mi-band-9-pro/device-profile.json && test -f devices/mi-band-9-pro/connection-notes.md && test -f devices/mi-band-9-pro/gateway/desktop/README.md
```

Expected: exit code `0`

- [ ] **Step 5: Commit**

```bash
git add devices/mi-band-9-pro
git commit -m "docs: add mi band 9 pro gateway docs"
```

## Chunk 2: Android Gateway App Skeleton

### Task 2: Scaffold the Android app and pure Kotlin models

**Files:**
- Create: `devices/mi-band-9-pro/gateway/android-app/settings.gradle.kts`
- Create: `devices/mi-band-9-pro/gateway/android-app/build.gradle.kts`
- Create: `devices/mi-band-9-pro/gateway/android-app/gradle.properties`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/build.gradle.kts`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/proguard-rules.pro`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/AndroidManifest.xml`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/res/values/strings.xml`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/res/values/themes.xml`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/BandConfig.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/model/GatewaySnapshot.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/model/GatewayStatus.kt`
- Test: `devices/mi-band-9-pro/gateway/android-app/app/src/test/java/com/javis/wearable/gateway/model/GatewaySnapshotTest.kt`

- [ ] **Step 1: Write the failing test**

Add a JVM unit test that constructs a snapshot and verifies the JSON payload contains the expected device identifiers and nullable metrics fields.

```kotlin
@Test
fun `snapshot json includes configured band identity`() {
    val json = GatewaySnapshot.sample().toJson()
    assertTrue(json.contains("D0:AE:05:0D:A0:94"))
    assertTrue(json.contains("940134049"))
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle test --tests com.javis.wearable.gateway.model.GatewaySnapshotTest
```

Expected: FAIL because the model and serializer do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- a minimal Android Gradle project
- immutable snapshot/status models
- JSON serialization helper
- fixed band configuration values from the approved spec

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle test --tests com.javis.wearable.gateway.model.GatewaySnapshotTest
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add devices/mi-band-9-pro/gateway/android-app
git commit -m "feat: scaffold mi band gateway android app"
```

### Task 3: Add embedded HTTP + SSE serving

**Files:**
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/http/GatewayHttpServer.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/http/SseBroker.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/store/GatewaySnapshotStore.kt`
- Test: `devices/mi-band-9-pro/gateway/android-app/app/src/test/java/com/javis/wearable/gateway/http/SseBrokerTest.kt`

- [ ] **Step 1: Write the failing test**

Add a JVM unit test for SSE formatting and a test that `/health/latest` output is generated from the cached snapshot.

```kotlin
@Test
fun `sse event encodes event type and json data`() {
    val payload = SseBroker.formatEvent("health_update", """{"metric":"heart_rate_bpm"}""")
    assertTrue(payload.contains("event: health_update"))
    assertTrue(payload.contains("""data: {"metric":"heart_rate_bpm"}"""))
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle test --tests com.javis.wearable.gateway.http.SseBrokerTest
```

Expected: FAIL because the server helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- `/status`
- `/health/latest`
- `/events`
- `/debug/source`
- an in-memory snapshot store
- SSE broadcasting for health and connection updates

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle test --tests com.javis.wearable.gateway.http.SseBrokerTest
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add devices/mi-band-9-pro/gateway/android-app
git commit -m "feat: add mi band gateway http and sse endpoints"
```

## Chunk 3: Android Data Collection And App Wiring

### Task 4: Add Health Connect and Bluetooth readers

**Files:**
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/health/HealthConnectRepository.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/health/HealthPermissions.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/bluetooth/BandConnectionRepository.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/service/GatewayForegroundService.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/MainActivity.kt`
- Test: `devices/mi-band-9-pro/gateway/android-app/app/src/test/java/com/javis/wearable/gateway/bluetooth/BandConnectionRepositoryTest.kt`

- [ ] **Step 1: Write the failing test**

Add a JVM unit test for the connection-state reducer so the Bluetooth mapping behavior is fixed before implementation.

```kotlin
@Test
fun `known band mac maps bonded but not connected state`() {
    val state = BandConnectionRepository.resolveState(
        deviceMac = "D0:AE:05:0D:A0:94",
        bonded = true,
        connected = false
    )
    assertEquals("bonded", state.status)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle test --tests com.javis.wearable.gateway.bluetooth.BandConnectionRepositoryTest
```

Expected: FAIL because the resolver does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- Health Connect availability and permission checks
- latest metric reads for heart rate, SpO2, and steps
- Bluetooth state lookup filtered to the configured MAC
- foreground service polling loop:
  - connection every `2s`
  - metrics every `3s`
- app activity for permission flow and service start/stop

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle test
```

Expected: PASS for all JVM tests

- [ ] **Step 5: Commit**

```bash
git add devices/mi-band-9-pro/gateway/android-app
git commit -m "feat: wire health connect and bluetooth state into gateway"
```

### Task 5: Build and install the debug app

**Files:**
- Modify: `devices/mi-band-9-pro/README.md`

- [ ] **Step 1: Write the failing test**

Use the build as the failing verification target before the app is complete.

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle assembleDebug
```

Expected: FAIL until the manifest, resources, and app wiring are complete.

- [ ] **Step 2: Run test to verify it fails**

Run the same command and observe the failure.

- [ ] **Step 3: Write minimal implementation**

Complete any missing manifest entries, notification channel setup, app strings, and service declarations so the build can succeed.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd devices/mi-band-9-pro/gateway/android-app && gradle assembleDebug
~/Library/Android/sdk/platform-tools/adb -s 4722a997 install -r app/build/outputs/apk/debug/app-debug.apk
```

Expected:
- Gradle build succeeds
- APK installs on the connected Xiaomi 12X

- [ ] **Step 5: Commit**

```bash
git add devices/mi-band-9-pro
git commit -m "build: produce installable mi band gateway apk"
```

## Chunk 4: Desktop Tunnel And Client Validation

### Task 6: Add desktop helper scripts and validation client

**Files:**
- Create: `devices/mi-band-9-pro/gateway/desktop/start_gateway_tunnel.sh`
- Create: `devices/mi-band-9-pro/gateway/desktop/start_gateway_tunnel.ps1`
- Create: `devices/mi-band-9-pro/gateway/desktop/poll_gateway.py`
- Create: `devices/mi-band-9-pro/gateway/desktop/stream_gateway.py`
- Test: `devices/mi-band-9-pro/gateway/desktop/test_gateway_client.py`

- [ ] **Step 1: Write the failing test**

Add a Python unit test that validates parsing of the `/health/latest` payload and SSE event handling from sample data.

```python
def test_parse_snapshot_heart_rate():
    snapshot = parse_snapshot({"metrics": {"heart_rate_bpm": 72}})
    assert snapshot["heart_rate_bpm"] == 72
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
python -m unittest devices.mi-band-9-pro.gateway.desktop.test_gateway_client
```

Expected: FAIL because the helper client does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- tunnel scripts for `adb reverse` and `adb forward`
- a polling client for `/status` and `/health/latest`
- a streaming client for `/events`

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
python -m unittest devices.mi-band-9-pro.gateway.desktop.test_gateway_client
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add devices/mi-band-9-pro/gateway/desktop
git commit -m "feat: add desktop tunnel and gateway clients"
```

### Task 7: End-to-end manual verification

**Files:**
- Modify: `devices/mi-band-9-pro/README.md`

- [ ] **Step 1: Write the failing test**

Use the live gateway checks as the failing verification target before the full setup is complete.

Run:

```bash
~/Library/Android/sdk/platform-tools/adb -s 4722a997 reverse tcp:8765 tcp:8765
curl http://127.0.0.1:8765/status
```

Expected: FAIL before the app is installed and running.

- [ ] **Step 2: Run test to verify it fails**

Run the commands above and confirm they fail when the gateway is not yet active.

- [ ] **Step 3: Write minimal implementation**

Start the gateway app on the phone, grant permissions, and update the README with the exact startup order and troubleshooting notes.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
~/Library/Android/sdk/platform-tools/adb -s 4722a997 reverse tcp:8765 tcp:8765
curl http://127.0.0.1:8765/status
curl http://127.0.0.1:8765/health/latest
python devices/mi-band-9-pro/gateway/desktop/stream_gateway.py --once
```

Expected:
- `/status` returns JSON
- `/health/latest` returns the approved schema
- the streaming client receives at least one event or keepalive

- [ ] **Step 5: Commit**

```bash
git add devices/mi-band-9-pro
git commit -m "docs: document verified mi band gateway workflow"
```

## Execution Notes

- Use `@superpowers/test-driven-development` while implementing each task.
- Use `apply_patch` for all manual file edits.
- Keep the band paired with Xiaomi Fitness on the phone; do not attempt direct desktop BLE pairing during this plan.
- If Health Connect does not return the target metrics on the current phone build, stop and surface that blocker before building workarounds.
- The current workspace is the active user workspace on `main`; proceed there because implementation was explicitly requested in-place.
