# Mi Band 9 Pro Local Source Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Xiaomi-local metrics source to the Android gateway, preferring provider probes and then best-effort Xiaomi log parsing before falling back to Health Connect.

**Architecture:** Introduce a source interface, a Xiaomi-local coordinator, pure parsing/probe helpers, and wire them into the foreground service without changing the external HTTP/SSE contract. Keep Health Connect as the final fallback while exposing richer debug state.

**Tech Stack:** Kotlin, Android SDK, ContentResolver, file IO, existing NanoHTTPD server, JUnit 4.

---

## Chunk 1: Source Abstractions And Pure Parsing

### Task 1: Add failing parser tests for Xiaomi structured logs

**Files:**
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/test/java/com/javis/wearable/gateway/local/XiaomiFitnessLogParserTest.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/local/XiaomiFitnessLogParser.kt`
- Modify: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/health/HealthConnectRepository.kt`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `gradle --no-daemon --console=plain app:testDebugUnitTest --tests com.javis.wearable.gateway.local.XiaomiFitnessLogParserTest` and verify it fails**
- [ ] **Step 3: Implement minimal parser support for `DailyStepReport` and `DailySpo2Report`**
- [ ] **Step 4: Re-run the targeted test and verify it passes**

## Chunk 2: Xiaomi Local Source

### Task 2: Add provider-probe and local-source tests

**Files:**
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/test/java/com/javis/wearable/gateway/local/XiaomiFitnessLocalSourceTest.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/local/GatewayMetricsSource.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/local/XiaomiFitnessProviderProbe.kt`
- Create: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/local/XiaomiFitnessLocalSource.kt`

- [ ] **Step 1: Write the failing tests for source precedence and debug classification**
- [ ] **Step 2: Run the targeted Android JVM tests and verify they fail**
- [ ] **Step 3: Implement provider result classification, log-access status, and source selection**
- [ ] **Step 4: Re-run the targeted tests and verify they pass**

## Chunk 3: Gateway Wiring

### Task 3: Wire the new source into the foreground service

**Files:**
- Modify: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/service/GatewayForegroundService.kt`
- Modify: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/model/GatewaySnapshot.kt`
- Modify: `devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/MainActivity.kt`

- [ ] **Step 1: Write/extend failing tests for debug-source rendering and source labels**
- [ ] **Step 2: Run `gradle --no-daemon --console=plain app:testDebugUnitTest` and verify the new assertions fail**
- [ ] **Step 3: Implement service wiring and richer `/debug/source` output**
- [ ] **Step 4: Re-run Android JVM tests and verify they pass**

## Chunk 4: Verification

### Task 4: Verify runtime behavior in the worktree

**Files:**
- Modify: `devices/mi-band-9-pro/README.md`
- Modify: `devices/mi-band-9-pro/progress-2026-03-15.md`
- Modify: `Readme/Dairy/2026-03-15-mi-band-9-pro-gateway-progress.md`

- [ ] **Step 1: Build the Android app with `gradle --no-daemon --console=plain app:assembleDebug`**
- [ ] **Step 2: Run `python3 -m unittest discover -s devices/mi-band-9-pro/gateway/desktop -p 'test_*.py'`**
- [ ] **Step 3: Install to `4722a997`, start the gateway, and poll `/status`, `/debug/source`, and `/health/latest`**
- [ ] **Step 4: Update docs with verified behavior and known limits**
